let ghState = {
	on: true,
	brightness: 70,
	color: {temperatureK: 3000}
}

let expectedActions = [
  {
    "command": "action.devices.commands.OnOff",
    "params": {
      "on": true
    }
  },
  {
    "command": "action.devices.commands.BrightnessAbsolute",
    "params": {
      "brightness": 70
    }
  },
  {
    "command": "action.devices.commands.ColorAbsolute",
    "params": {
      "color": {
        "temperatureK": 3000
      }
    }
  }
]

// --------------------------------


kelvinToMiredScale(1801) === 555
kelvinToMiredScale(1802) === 555
kelvinToMiredScale(1803) === 555
kelvinToMiredScale(1804) === 554
kelvinToMiredScale(1805) === 554
kelvinToMiredScale(2000) === 500
kelvinToMiredScale(3000) === 333
kelvinToMiredScale(4000) === 250
kelvinToMiredScale(5000) === 200
kelvinToMiredScale(6000) === 167
kelvinToMiredScale(6535) === 153
kelvinToMiredScale(6536) === 153
kelvinToMiredScale(6537) === 153
MiredScaleToKelvin(150) === 6536
MiredScaleToKelvin(153) === 6536
MiredScaleToKelvin(154) === 6494
MiredScaleToKelvin(200) === 5000
MiredScaleToKelvin(300) === 3333
MiredScaleToKelvin(400) === 2500
MiredScaleToKelvin(500) === 2000
MiredScaleToKelvin(554) === 1805
MiredScaleToKelvin(555) === 1802
MiredScaleToKelvin(556) === 1802