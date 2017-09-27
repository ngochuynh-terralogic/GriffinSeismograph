import React, { Component, PropTypes } from 'react';

const jQuery = window['$'];

class Seismograph extends Component {
  constructor(props){
    super(props);
    Chart.defaults.global.animation = false;
    Chart.defaults.global.showTooltips = false;
   // Chart.defaults.global.tooltips.enabled = false;
   // Chart.defaults.global.legend.display = false;
    //Chart.defaults.global.title.display = false;
   // Chart.defaults.global.elements.point.radius = 0;
    //Chart.defaults.global.elements.point.hoverRadius = 0;
    Chart.defaults.global.scaleShowLabels = false;
    Chart.defaults.global.scaleFontColor = '#999';
    this.state = {
      currenteq: [],
      lasteq: [],
      canvasesLoaded: 0,
      currentWidth: 0,
      lastWidth: 0
    };
  }

  drawChart = (data, element, labelCount, lastEQ) => {
    let currentWidth = Math.floor(jQuery('#currentReadings').width());
    let lasteqWidth = Math.floor(jQuery('#lastEQ').width());

    if(this.state.canvasesLoaded !== 2){
      if(element === 'currentReading_canvas'){
        this.setState({
          currenteq: data,
          currentWidth: currentWidth
        });
      } else if (element === 'lastEQ_canvas'){
        this.setState({
          lasteq: data,
          lastWidth: lasteqWidth
        });
      }

      this.setState({
        canvasesLoaded: this.state.canvasesLoaded += 1,
      });
    } else {
      jQuery(`#${element}`).remove();
      if(element === 'currentReading_canvas'){
        this.setState({ currentWidth: currentWidth });
        jQuery(`<canvas id="currentReading_canvas" width="${currentWidth}" height="230"></canvas>`).insertBefore(jQuery('#currentReadings .whitebox'));
        jQuery('#currentReadings .whitebox').width((currentWidth * 0.991176470588235));
      } else if (element === 'lastEQ_canvas'){
        this.setState({lastWidth: lasteqWidth });
        jQuery(`<canvas id="lastEQ_canvas" width="${lasteqWidth}" height="230"></canvas>`).insertBefore(jQuery('#lastEQ .whitebox'));
        jQuery('#lastEQ .whitebox').width((lasteqWidth * 0.991176470588235));
      }
    }

    let startTime = new Date(data.Start),
      endTime = new Date(data.End),
      secondsPerFrame = parseInt(Math.round((endTime - startTime) / data.Samples.length)),
      labelArray = [],
      highestNum = 0,
      lowestNum = 0,
      default_steps = 8,
      default_start_value = -200,
      fullMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    for(let i = 0; i < data.Samples.length; i++){
      if(data.Samples[i] > highestNum){ highestNum = data.Samples[i]; }
      if(data.Samples[i] < lowestNum){ lowestNum = data.Samples[i]; }
      let testDate = new Date(startTime.getTime() + (i * secondsPerFrame));
      let theMonth = fullMonth[testDate.getMonth()];
      let amPM = testDate.getHours() > 11 ? 'PM' : 'AM';
      let theHour = testDate.getHours() > 12 ? (testDate.getHours() - 12) : testDate.getHours();
      let theMinutes = testDate.getMinutes() < 10 ? ('0' + testDate.getMinutes().toString()) : testDate.getMinutes();
      let newTime = theHour + ':' + theMinutes + ' ' + amPM;
      labelArray.push(newTime);
      if(lastEQ && i == 0){
        jQuery('#lastEQDate').html(theMonth + ' ' + testDate.getDate() + ', ' + testDate.getFullYear());
      }

    }

    let lineData = {
      labels: labelArray,
      datasets: [
        {
          label:'Earthquakes',
          fillColor: "rgba(0,0,0,0)",
          strokeColor: "rgba(190,0,0,1)",
          data: data.Samples
        }
      ]
    }
    if(highestNum > 200 || lowestNum < -200){ default_steps = 32; default_start_value = -800; }
    let ctx = jQuery('#' + element).get(0).getContext('2d');
    let myNewChart = new Chart(ctx).Line(lineData, { bezierCurve: false, showXLabels: labelCount, pointDot: false, scaleOverride: true, scaleSteps: default_steps, scaleStepWidth: 50, scaleStartValue: default_start_value, datasetStroke: false, datasetStrokeWidth: 1, scaleShowGridLines: false, datasetFill: false });

    /*let myNewChart = new Chart(ctx, {
      type: 'line',
      data: lineData,
      options: { lineTension: 0, tooltip: { enabled: false }, borderWidth:1 }
    });*/
  }

  componentDidMount(){
    //after dom injected
    let currentReadingRatio = 0.5822784810126582;
    let currentWidth = Math.floor(jQuery('#currentReadings').width());
    let lasteqWidth = Math.floor(jQuery('#lastEQ').width());
    let modifiedHeight = Math.round(currentWidth * currentReadingRatio);

    jQuery('#currentReading_canvas').attr('width', `${currentWidth}px`);
    jQuery('#currentReadings .whitebox').width((currentWidth * 0.991176470588235));
    jQuery('#lastEQ_canvas').attr('width', `${lasteqWidth}px`);
    jQuery('#lastEQ .whitebox').width((lasteqWidth * 0.991176470588235));
    //jQuery('#currentReading_canvas').attr('height', `${modifiedHeight}px`);


    jQuery.ajax({
      url:'http://ftpcontent.worldnow.com/kwtv/custom/earthquake/data.json',
      dataType:'jsonp',
      jsonpCallback:'EarthquakeData',
      success: (data) => { this.drawChart(data, 'currentReading_canvas', 3); },
      error: (jqHXR, textStatus, errorThrown) => { console.log(textStatus); console.log(errorThrown); }
    });
    jQuery.ajax({
      url:'http://ftpcontent.worldnow.com/kwtv/custom/earthquake/earthquakehistory.json',
      dataType:'jsonp',
      jsonpCallback:'EarthquakeManifest',
      success: (data) => {
        jQuery.ajax({
          url:'http://ftpcontent.worldnow.com/kwtv/custom/earthquake/' + data[(data.length - 1)].Name,
          dataType:'jsonp',
          jsonpCallback:'EarthquakeHistory',
          success: (data) => { this.drawChart(data, 'lastEQ_canvas', 1, true); },
          error: (jqHXR, textStatus, errorThrown) => { console.log(textStatus); console.log(errorThrown); }
        });
      },
      error: (jqHXR, textStatus, errorThrown) => { console.log(textStatus); console.log(errorThrown); }
    });

    jQuery(window).on('resize', (e) => {
      if(Math.floor(jQuery('#currentReadings').width()) !== this.state.initialWidth){
        this.drawChart(this.state.currenteq, 'currentReading_canvas', 3);
        this.drawChart(this.state.lasteq, 'lastEQ_canvas', 1, true);
      }
    });
  }

  render(){
    return (
      <div>
        <h2 className="gHead">News 9 Seismograph</h2>
        <div id="letsGetReadyToRumble">
          <div id="currentReadings">
            <div className="top">
              <h2>Current Reading</h2>
              <h4>Now</h4>
            </div>
            <canvas id="currentReading_canvas" width="395" height="230"></canvas>
            <div className="whitebox">
              <div className="vertical">
                <div className="top">
                  <div className="line two"></div>
                  <div className="line three"></div>
                </div>
                <div className="bottom">
                  <div className="line two"></div>
                  <div className="line three"></div>
                </div>
              </div>
              <div className="horizontal">
                <div className="left">
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                </div>
                <div className="right">
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                </div>
              </div>
            </div>
          </div>
          <div id="lastEQ">
            <div className="top">
              <h2>Last Earthquake</h2>
              <h4 id="lastEQDate"></h4>
            </div>
            <canvas id="lastEQ_canvas" width="230" height="230"></canvas>
            <div className="whitebox">
              <div className="vertical">
                <div className="top">
                  <div className="line two"></div>
                  <div className="line three"></div>
                </div>
                <div className="bottom">
                  <div className="line two"></div>
                  <div className="line three"></div>
                </div>
              </div>
              <div className="horizontal">
                <div className="left">
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                </div>
                <div className="right">
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Seismograph;
