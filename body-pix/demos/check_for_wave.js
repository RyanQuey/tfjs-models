/**
 * @license
 * I made this one
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as posenet from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs-core';
import Chart from 'chart.js'

const LEFT_ARM_PARTS = [
  "leftWrist", 
  "leftShoulder",
  "leftElbow",
]

// want to keep just last 100 or so, so make a queue
// TODO get more performant queue implementation
export function queueLatestLog(log, logArr) {
  if (logArr.length > 99) {
    logArr.shift()
  }
  logArr.push(log)
}

// only returns pose data, not window height or the Int32Array data
// NOTE I'm ignoring whether smiling, other body gestures indicate a wave for now, just left arm
// for proof of concept
export function extractLeftArm(segmentation) {
  // assuming first one returned is best (sometimes more are returned if we're unsure about accuracy
  // I think); I'm not sure when multiple are ever returned
  const pose = segmentation.allPoses[0]
  const score = pose.score
  const handKeyPoints = pose.keypoints.filter(p => LEFT_ARM_PARTS.includes(p.part)
  )

  return {score, handKeyPoints}
}

// TODO maybe start by only following the wrist, to see if we can get a picture of what kind of
// wrist movements are approximately a wave
var ctx = document.getElementById('myChart').getContext('2d');
ctx.height = 500
ctx.width = 500

const myChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [...Array(100).keys()],
    // TODO store/retrieve this data more efficiently
    // One dataset per arm part
    datasets: LEFT_ARM_PARTS.map((partKey, partIndex) => ({
      label: partKey,
      data: {x: 100, y: 100},
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ][partIndex],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ][partIndex],
      borderWidth: 1
    })),
  },
  options: {
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true,
          stepSize: 50,
          suggestedMax: 550 // size of pixels we're showing, which is therefore max we'll get 
        }
      }]
    }
  }
});

export function generateChart (leftArmLog) {
  myChart.data.datasets.forEach((dataset, partIndex) => {
    let partKey = LEFT_ARM_PARTS[partIndex]

    // mutate the dataset. Key "data" should be into array of logs
    dataset.data = leftArmLog.map((log, index) => {
      let match = log.handKeyPoints.find(keyPoint => keyPoint.part == partKey) || {}
      let xCoordinate = (match.position || {}).x 
      let yCoordinate = (match.position || {}).y

      return xCoordinate;

      return {
        x: index, 
        y: xCoordinate,
      }
    })
  }),

  myChart.update()
}
