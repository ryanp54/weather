(window.webpackJsonpapp=window.webpackJsonpapp||[]).push([[0],{138:function(e,t,a){e.exports=a(258)},143:function(e,t,a){},144:function(e,t,a){},258:function(e,t,a){"use strict";a.r(t);var n=a(1),r=a.n(n),c=a(125),l=a.n(c),o=(a(143),a(45)),s=a(264),i=a(265),u=a(266),m=a(272),d=(a(144),a(267)),f=a(269),E=a(273),h=a(126),b=a.n(h);a(155);function p(e){var t=new Date;return t.setDate(t.getDate()-e),t}function v(e){return e.toISOString().split("T")[0]}var g="_self"in r.a.createElement("div")?"https://weather2019.appspot.com/OAX/forecasts/analyze?":"/OAX/forecasts/analyze?";function w(e){var t=Object(n.useState)(!1),a=Object(o.a)(t,2),c=a[0],l=a[1];return r.a.createElement(s.a,{md:"auto"},r.a.createElement(i.a,null,r.a.createElement(s.a,null,r.a.createElement("label",null,e.label+":"),r.a.createElement("span",{className:"advisory float-right text-danger"}," ".concat(c?"Check date.":"")))),r.a.createElement(i.a,null,r.a.createElement(s.a,null,r.a.createElement(b.a,Object.assign({},e,{onDayChange:function(t,a){!t||a.disabled&&!c?l(!0):t&&!a.disabled&&(c&&l(!1),e.onChange(t))},dayPickerProps:{disabledDays:{before:new Date(2019,1,1),after:p(2)}}})))))}function y(e){var t=e.onFetch,a=Object(n.useState)(p(10)),c=Object(o.a)(a,2),l=c[0],d=c[1],f=Object(n.useState)(p(3)),E=Object(o.a)(f,2),h=E[0],b=E[1],y=function(){return t(fetch("".concat(g,"start=").concat(v(l),"&end=").concat(v(h))))};return Object(n.useEffect)(y,[]),r.a.createElement(u.a,null,r.a.createElement(i.a,{className:"align-items-end justify-content-center"},r.a.createElement(w,{label:"Start",value:l,onChange:d}),r.a.createElement(w,{label:"End",value:h,onChange:b}),r.a.createElement(s.a,{md:2},r.a.createElement(m.a,{onClick:y},"Analyze"))))}function O(e){var t=e.analysis,a=e.weather,n=void 0===a?"temperature":a,c=t.obs.map(function(e){return{x:e.time,y:e.observed_weather[n]}}),l=function(e){return t.fcasts[e].map(function(e){return{x:e.valid_time,y:e.predicted_weather[n]}})},o=[];for(var s in t.fcasts)o.push(r.a.createElement(d.a,{data:l(s),style:{data:{opacity:s>1?(8-s)/10:1,stroke:"red"}},key:s}));return r.a.createElement(f.a,{scale:{x:"time"},domainPadding:{y:20}},r.a.createElement(E.a,{tickCount:4,tickFormat:function(e){var t=new Date(e);return"".concat(t.getMonth()+1,"/").concat(t.getDate()," ").concat(t.getHours(),":00")},style:{ticks:{stroke:"black",size:5}},offsetY:50}),r.a.createElement(E.a,{dependentAxis:!0,crossAxis:!1}),o,r.a.createElement(d.a,{data:c}))}var j=function(){var e=Object(n.useState)(null),t=Object(o.a)(e,2),a=t[0],c=t[1],l=Object(n.useState)("Select date range."),s=Object(o.a)(l,2),m=s[0],d=s[1];return r.a.createElement(u.a,null,r.a.createElement(i.a,null,r.a.createElement(y,{onFetch:function(e){d("Retrieving results..."),c(null),e.then(function(e){return e.json()}).then(function(e){return c(e)}).catch(function(e){return d(e.message)})}})),r.a.createElement(i.a,null,a?r.a.createElement(O,{analysis:a,weather:"temperature"}):m))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));l.a.render(r.a.createElement(j,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(function(e){e.unregister()})}},[[138,1,2]]]);
//# sourceMappingURL=main.1f12078b.chunk.js.map