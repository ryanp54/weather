"""Main code for handling web requests."""

from functools import wraps
from datetime import date, datetime, timedelta

from weather.ndb_setup import (
    RawForecast, RawObservation, Forecast, RecordError)
from weather.nws_parse import GridData, ObservationData
from weather.fcastanalysis import FcastAnalysis

from requests import get
from flask import Flask, request, send_from_directory, jsonify
from requests_toolbelt.adapters import appengine

appengine.monkeypatch()

app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
app.config['JSON_AS_ASCII'] = False


# Info for NWS API queries.
nws_wfo = 'OAX'  # Also used for the routes.
nws_gridpoint = '{}/76,56'.format(nws_wfo)
nws_station = 'KMLE'
nws_headers = {
    'user-agent':
        'site:weather2019.appspot.com; contact-email:ryanp54@yahoo.com'
}


# # # Route wrappers # # #


def cron_only(f):
    @wraps(f)
    def restricted2cron(*args, **kwargs):
        if (
            request.headers.get('Host') != 'localhost:8080'
            and not request.headers.get('X-Appengine-Cron')
        ):
            return 'Forbidden', 403
        return f(*args, **kwargs)
    return restricted2cron


def allow_cors(f):
    @wraps(f)
    def cors_fix(*args, **kwargs):
        resp = f(*args, **kwargs)
        resp.headers['Access-Control-Allow-Origin'] = '*'
        return resp
    return cors_fix


# # # Routes # # #

@app.route('/')
@app.route('/index')
def welcome():
    return send_from_directory('app/build', 'index.html')


@app.route('/{}/forecasts/record'.format(nws_wfo))
@cron_only
def record_forecast():
    resp = get(
        'https://api.weather.gov/gridpoints/' + nws_gridpoint,
        headers=nws_headers)
    grid_data = GridData(resp.json()['properties'])
    if grid_data.made_t < days_ago(1):
        stale = RecordError(
            error_message='Forecast record fail: forecast was not current.')
        stale.put()
        resp.status_code = 500
    elif resp.status_code >= 200 and resp.status_code < 300:
        resp = jsonify(map(lambda key: key.id(), grid_data.to_ndb()))
    return resp


@app.route('/{}/forecasts/analyze'.format(nws_wfo))
@allow_cors
def analyze_fcasts():
    start = request.args['start']
    end = request.args['end']
    analysis = FcastAnalysis(start, end).forjson()

    return jsonify(analysis)


@app.route('/{}/forecasts/'.format(nws_wfo))
@allow_cors
def get_forecasts():
    query = Forecast.query()
    for param, val in request.args.items():
        try:
            prop = getattr(Forecast, param)
        except AttributeError:
            pass
        else:
            if prop is Forecast.lead_days:
                val = int(val)
            query = query.filter(prop == val)

    resp = map(lambda result: result.to_dict(), query.fetch(168))
    return jsonify(
        sorted(resp, key=lambda x: [x['valid_time'], x['lead_days']]))


@app.route('/{}/observations/record'.format(nws_wfo))
@cron_only
def record_observation():
    resp = get(
        'https://api.weather.gov/stations/' + nws_station
        + '/observations?end=' + days_ago(1).isoformat().split('.')[0]
        + 'Z&start=' + days_ago(4).isoformat().split('.')[0] + 'Z',
        headers=nws_headers
    )
    if resp.status_code >= 200 and resp.status_code < 300:
        obs_data = ObservationData(resp.json()['features'])
        obs_data.put_raw()
        resp = jsonify(map(lambda key: key.id(), obs_data.to_ndb()))
    if len(obs_data.ndb_obs) == 0:
        RecordError(
            error_message='Observation record fail: no new observations found.'
        ).put()
        resp.status_code = 500
    return resp


@app.route('/{}/rawForecasts/record'.format(nws_wfo))
@cron_only
def record_rawforecast():
    r = get(
        'https://api.weather.gov/gridpoints/' + nws_gridpoint,
        headers=nws_headers)
    new_forecast = RawForecast(
        date=date.today().isoformat(),
        forecast=r.json())
    if r.status_code >= 200 and r.status_code < 300:
        new_forecast.put()

    return jsonify(r.json()), r.status_code


@app.route('/{}/rawForecasts/'.format(nws_wfo))
@app.route('/{}/rawForecasts/<date_made>'.format(nws_wfo))
def get_rawforecasts(date_made=None):
    if date_made:
        forecast = RawForecast.query(RawForecast.date == date_made).get()
    else:
        forecast = RawForecast.query().order(-RawForecast.date).get()
    return jsonify(
        forecast={'date': forecast.date, 'forecast': forecast.forecast})


@app.route('/{}/rawObservations/'.format(nws_wfo))
@app.route('/{}/rawObservations/<date_made>'.format(nws_wfo))
def get_rawobservations(date_made=None):
    if date_made:
        observation = RawObservation.query(
            RawObservation.date == date_made
        ).get()
    else:
        observation = RawObservation.query().order(-RawObservation.date).get()
    return jsonify(
        observation={
            'date': observation.date,
            'observation': observation.observation
        })


# # # Helper functions # # #

def days_ago(days): return datetime.utcnow() - timedelta(days=days)
