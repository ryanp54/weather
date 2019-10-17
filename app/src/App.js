import React, {
  useState, useCallback, useMemo,
} from 'react';

import {
  Container, Row, Col, Button, Tabs, Tab,
} from 'react-bootstrap';

import {
  VictoryChart,
  VictoryAxis,
  VictoryArea,
  VictoryGroup,
  VictoryLabel,
  VictoryLine,
  VictoryLegend,
  VictoryVoronoiContainer,
} from 'victory';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';

import './App.css';

import { getDaysAgo, getISODate } from './dateUtilities';
import { testData } from './testData';

const API_URL = '_self' in React.createElement('div')
  ? 'https://weather2019.appspot.com/OAX/forecasts/analyze?'
  : '/OAX/forecasts/analyze?';

function ForecastDayPicker({ label, onChange, ...rest }) {
  const [warned, setWarned] = useState(false);

  return (
    <Col className='pb-3'>
      <Row>
        <Col>
          <label>
            {`${label}:`}
          </label>
          <span className={'advisory float-right text-danger'}>
            {` ${warned ? 'Check date.' : ''}`}
          </span>
        </Col>
      </Row>
      <Row>
        <Col>
          <DayPickerInput
            {...rest}
            onDayChange={(day, mod) => {
              if (!day || (mod.disabled && !warned)) {
                setWarned(true);
              } else if (day && !mod.disabled) {
                if (warned) {
                  setWarned(false);
                }
                onChange(day);
              }
            }}
            dayPickerProps={{
              disabledDays: {
                before: new Date(2019, 1, 1),
                after: getDaysAgo(2),
              },
            }}
          />
        </Col>
      </Row>
    </Col>
  );
}

function DateRangeForm({ onFetch }) {
  const [start, setStart] = useState(getDaysAgo(10));
  const [end, setEnd] = useState(getDaysAgo(3));

  const fetchReturn = () => (
    onFetch(fetch(`${API_URL}start=${getISODate(start)}&end=${getISODate(end)}`))
  );

  return (
    <Container className='pb-3'>
      <Row className='d-flex justify-content-center'>
        <Col xs={'auto'}>
          <ForecastDayPicker
            label={'Start'}
            value={start}
            onChange={setStart}
          />
        </Col>
        <Col xs={'auto'}>
          <ForecastDayPicker
            label={'End'}
            value={end}
            onChange={setEnd}
          />
        </Col>
        <Col md={2} className='d-flex align-self-center justify-content-center mt-3'>
          <Button
            onClick={fetchReturn}
          >
            Submit
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

const ForecastChart = ({ analysis, activeDay, onChange }) => {
  const activeFcasts = activeDay ? [activeDay] : Object.keys(analysis.lead_days);

  const displayedFcastLines = (
    <VictoryGroup displayName='Forecast' color='red'>
      {
        activeFcasts.map((leadDay, i) => (
          <VictoryLine
            displayName={`${leadDay}-Day`}
            name={`${leadDay}-Day`}
            key={leadDay}
            data={Object.entries(analysis.lead_days[leadDay].fcasts)}
            x={(datum) => new Date(datum[0])}
            y={1}
            style={{
              data: {
                opacity: i >= 1 ? (9 - i) / 10 : 1.0,
              },
            }}
          />
        ))
      }
    </VictoryGroup>
  );


  const observedLine = (
    <VictoryGroup displayName='Actual' color='black'>
      <VictoryLine
        displayName='Actual'
        name='Actual'
        data={Object.entries(analysis.obs)}
        x={(datum) => new Date(datum[0])}
        y={1}
      />
    </VictoryGroup>
  );

  const displayedErrea = (
    <VictoryGroup
      displayName='Error'
      style={{
        data: {
          opacity: 0.4,
          fill: 'magenta',
          stroke: 'magenta',
        },
        legendSymbol: { type: 'square' },
      }}
    >
      {activeDay
        ? Object.entries(analysis.lead_days[activeDay].errors).reduce(
            // Create data for error VictoryAreas and organize into contiguous areas. 
            (erreas, [timeStr, amount]) => {
              const time = new Date(timeStr);
              const erreaDatum = {
                x: time,
                y: analysis.lead_days[activeDay].fcasts[timeStr],
                y0: analysis.obs[timeStr],
                amount,
              };

              const lastErrea = erreas.length > 0 ? erreas[erreas.length - 1] : false;
              if (
                lastErrea
                && lastErrea.slice(-1)[0].x.valueOf() === time.valueOf() - 3600000
              ) {
                lastErrea.push(erreaDatum);
              } else {
                erreas.push([erreaDatum]);
              }

              return erreas
            },
            [],
          ).map((errea, i) => (
            <VictoryArea
                displayName={`Error-Area-${i}`}
                name={`Error-Area-${i}`}
                data={errea}
                key={`Error-Area-${i}`}
            />
          ))
        : []
      }
    </VictoryGroup>
  );

  const legendData = [
    ...Object.keys(analysis.lead_days).map((day) => {
      const dayLabel = `${day}-Day`;
      const line = displayedFcastLines.props.children.find(
        (child) => child.props.name === dayLabel,
      );
      const style = line && { ...line.props.theme.line.style, ...line.props.style };

      return {
        name: `${day}-Day`,
        symbol: {
          opacity: line ? style.data.opacity : 0.1,
          fill: displayedFcastLines.props.color,
          cursor: 'pointer',
        },
        labels: {
          opacity: line ? 1 : 0.2,
          cursor: 'pointer',
        },
      };
    }),
    ...[observedLine, displayedErrea].map(
      (group) => {
        const style = { ...group.props.theme.line.style, ...group.props.style };
        const isCharted = group.props.children.length !== 0;
        return {
          name: group.props.displayName,
          symbol: {
            opacity: isCharted ? style.data.opacity : 0.2,
            fill: style.data.stroke,
            cursor: 'pointer',
            type: style.legendSymbol && style.legendSymbol.type ? style.legendSymbol.type : 'circle',
          },
          labels: {
            opacity: isCharted ? 1 : 0.2,
            cursor: 'pointer',
          },
        };
      },
    ).filter(Boolean),
  ];

  const toggleDisplayed = (labelName) => {
    const allFcastDays = Object.keys(analysis.lead_days);
    const [day] = labelName.split('-Day');
    let newActiveDay = false;
    if (!activeDay) {
      if (labelName.includes('Error')) {
        [newActiveDay] = activeFcasts;
      } else if (allFcastDays.includes(day)) {
        newActiveDay = day;
      }
    } else if (labelName === 'Actual' || activeFcasts.includes(day)) {
      newActiveDay = null;
    } else if (allFcastDays.includes(day)) {
      newActiveDay = day;
    }
    onChange(newActiveDay, []);
  };

  return (
    <Container className='pt-3'>
      <Row>
        <ErrorStatsDisplay
          activeDay={activeDay}
          analysis={analysis}
        />
      </Row>
      <Row>
        <VictoryChart scale={{ x: 'time' }} domainPadding={{ y: 20 }}
          padding={{
            top: 25, bottom: 50, left: 50, right: 75,
          }}
          containerComponent={
            <VictoryVoronoiContainer
              voronoiDimension='x'
              labels={() => null}
              labelComponent={<Cursor />}
              onActivated={(points) => onChange(false, points)}
            />
          }
        >
          <VictoryLegend x={25} y={10}
            orientation='horizontal'
            borderPadding={{
              top: 0, bottom: 0, left: 5, right: 0,
            }}
            gutter={10}
            symbolSpacer={5}
            style={{ labels: { fontSize: 9 } }}
            data={ legendData }
            toggleDisplayed={toggleDisplayed}
            events={[{
              eventHandlers: {
                onClick: (evt, target, i, legend) => {
                  if (target && target.datum) {
                    legend.props.toggleDisplayed(target.datum.name);
                  }
                },
              },
            }]}
          />

          <VictoryAxis
            tickCount={6}
            tickFormat={(dateTime) => {
              const date = `${dateTime.getMonth() + 1}/${dateTime.getDate()}`;
              const time = dateTime.toLocaleTimeString().split(/[:\s]/);
              return dateTime.getHours() ? `${time[0]} ${time.slice(-1)}` : date;
            }}
            style={{
              ticks: { stroke: 'black', size: 5 },
              tickLabels: { fontSize: 12 },
              grid: { stroke: 'grey' },
            }}
            offsetY={50}
          />
          <VictoryAxis
            dependentAxis
            crossAxis={false}
            style={{
              grid: { stroke: 'grey' },
              tickLabels: { fontSize: 12 },
            }}
            label='°C'
            axisLabelComponent={<VictoryLabel dx={-15} angle={0} />}
          />

          {displayedErrea}
          {displayedFcastLines}
          {observedLine}

        </VictoryChart>
      </Row>
    </Container>
  );
};

function ErrorStatsDisplay({ analysis, activeDay }) {
  const activeDayDisplayText = !activeDay ? 'Cumulative' : `${activeDay}-Day`;
  const stats = !activeDay ? analysis.cumulative_stats : analysis.lead_days[activeDay].stats;

  return (
    <Container>
      <Row className='d-flex justify-content-center'>
        <h6>
          {`Forecast Accuracy: ${activeDayDisplayText}`}
        </h6>
      </Row>
      <Row className='d-flex justify-content-center'>
          {
            Object.keys(stats).map((type) => (
              Object.keys(stats[type]).map((prop) => {
                if (type.includes(prop)) {
                  return (
                    <LabeledValue
                     label={type}
                     value={stats[type][prop]}
                     key={prop}
                   />
                  );
                }
                return false;
              })
            )).flat().filter(Boolean)
          }
      </Row>
    </Container>
  );
}

function Cursor({ x, scale }) {
  const range = scale.y.range();
  return (
    <line
      style={{
        stroke: 'lightgrey',
        strokeWidth: 1,
      }}
      x1={x}
      x2={x}
      y1={Math.max(...range)}
      y2={Math.min(...range)}
    />
  );
}

const MemodForecastChart = React.memo(ForecastChart);

function AnalysisChart({ analysis }) {
  const [activeFcastDay, setActiveFcastDay] = useState(null);
  const [activeData, setActiveData] = useState([]);

  const handleChange = useCallback(
    (newActiveDay, newActiveData) => {
      if (newActiveDay !== false) {
        setActiveFcastDay(newActiveDay);
      }
      if (newActiveData) {
        setActiveData(newActiveData);
      }
    },
    [],
  );

  return (
    <Container>
      <Row>
        <MemodForecastChart
          analysis={analysis}
          activeDay={activeFcastDay}
          onChange={handleChange}
        />
      </Row>
      <Row>
        <ActiveDataDisplay
          displayName={analysis.metadata.display_name}
          data={activeData}
        />
      </Row>
    </Container>
  );
}

function toTitleCase(str) {
  return (
    str.replace(
      /_/,
      ' ',
    ).replace(
      /(?:(^|\(|"|\s|-|,)\w)\w+/g,
      (match) => (match === match.toUpperCase() ? match.toLowerCase() : match),
    ).replace(
      /(?:^|\(|"|\s|-|,)\w/g,
      (match) => match.toUpperCase(),
    )
  );
}

/* * * Current Data Detail Display * * */

function ActiveDataDisplay({ displayName, data }) {
  if (!data || data.length === 0) {
    return '';
  }

  const [date, time] = data[0]._x.toLocaleString({ dateStyle: 'short', timeStyle: 'short' })
    .split(',');

  const formattedData = [];
  let formattedErrorDatum;
  data.forEach((datum) => {
    if (datum._y === null) {
      return;
    }

    if (!datum.childName.includes('Error')) {
      formattedData.push(
        <LabeledValue
          label={datum.childName}
          value={datum._y}
          key={datum.childName}
        />,
      );
    } else {
      formattedErrorDatum = <LabeledValue
          label='Forecast Error'
          value={datum.amount}
          key='Forecast Error'
          className='text-danger'
        />;
    }
  });

  if (formattedErrorDatum) {
    formattedData.push(formattedErrorDatum);
  }

  return (
    <Container className='h6 font-weight-normal'>
      <Row className='d-flex justify-content-center pb-2'>
        <Col>
           {`${displayName} on ${date} at ${time}`}
         </Col>
      </Row>
      <Row>
        {formattedData}
      </Row>
    </Container>
  );
}

function LabeledValue({
  label, value, type, className,
}) {
  const formatForDisplay = (val, units) => `${Math.round(val * 10) / 10}${units}`;
  const valueType = (type || label).toLowerCase();

  let formattedValue;
  if (valueType === 'accuracy') {
    formattedValue = formatForDisplay(value * 100.0, '%');
  } else {
    formattedValue = formatForDisplay(value, '°C');
  }
  return (
    <span className={`mr-3 d-inline-block ${className}`}>
      <span> {toTitleCase(label)}: </span>
      <span className='font-weight-light ml-2'> {formattedValue} </span>
    </span>
  );
}

/* * * Main App * * */

function AnalysisPage() {
  const [weather, setWeather] = useState('temperature');
  const [analysis, setAnalysis] = useState(JSON.parse(testData));
  const [statusMessage, setStatusMessage] = useState('Select date range.');

  // List of weather types Analysis chart is set-up to handle.
  // TODO: Finish all and refator to something more appropriate.
  const workingWeathers = ['temperature', 'dewpoint', 'wind_speed', 'cloud_cover'];

  return (
    <Container>
      <Row className='py-4'>
        <DateRangeForm
          onFetch={(request) => {
            setStatusMessage('Retrieving...');
            setAnalysis(null);
            request.then((resp) => resp.json())
              .then((json) => {
                setAnalysis(json);
              }).catch((error) => setStatusMessage(error.message));
          }}
        />
      </Row>
      {
        analysis
          ? (
            <Row>
              <Container>
                <Tabs activeKey={weather} onSelect={(key) => setWeather(key)} justify className='h6'>
                  {
                    workingWeathers.map((weatherType) => (
                      <Tab
                        eventKey={analysis[weatherType].metadata.prop_name}
                        title={analysis[weatherType].metadata.display_name}
                        key={analysis[weatherType].metadata.prop_name}
                      />
                    ))
                  }
                </Tabs>
              </Container>
              <AnalysisChart
                analysis={analysis[weather]}
              />
            </Row>
          )
          : <Row> {statusMessage} </Row>
        }
    </Container>
  );
}

export default AnalysisPage;