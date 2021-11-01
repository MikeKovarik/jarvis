/*
[
  {
    "date_code": "20190715",
    "definition": {
      "description": "TRADFRI shortcut button",
      "exposes": [
        {
          "access": 1,
          "description": "Remaining battery in %",
          "name": "battery",
          "property": "battery",
          "type": "numeric",
          "unit": "%",
          "value_max": 100,
          "value_min": 0
        },
        {
          "access": 1,
          "description": "Triggered action (e.g. a button click)",
          "name": "action",
          "property": "action",
          "type": "enum",
          "values": [
            "on",
            "brightness_move_up",
            "brightness_stop"
          ]
        },
        {
          "access": 1,
          "description": "Link quality (signal strength)",
          "name": "linkquality",
          "property": "linkquality",
          "type": "numeric",
          "unit": "lqi",
          "value_max": 255,
          "value_min": 0
        }
      ],
      "model": "E1812",
      "supports_ota": true,
      "vendor": "IKEA"
    },
    "endpoints": {
      "1": {
        "bindings": [
          {
            "cluster": "genPowerCfg",
            "target": {
              "id": 901,
              "type": "group"
            }
          }
        ],
        "clusters": {
          "input": [
            "genBasic",
            "genPowerCfg",
            "genIdentify",
            "genAlarms",
            "genPollCtrl",
            "touchlink"
          ],
          "output": [
            "genIdentify",
            "genGroups",
            "genOnOff",
            "genLevelCtrl",
            "genOta",
            "closuresWindowCovering",
            "touchlink"
          ]
        },
        "configured_reportings": [
          {
            "attribute": "batteryPercentageRemaining",
            "cluster": "genPowerCfg",
            "maximum_report_interval": 62000,
            "minimum_report_interval": 3600,
            "reportable_change": 0
          }
        ]
      }
    },
    "friendly_name": "shortcut-button-1",
    "ieee_address": "0xb4e3f9fffebdf0a5",
    "interview_completed": true,
    "interviewing": false,
    "manufacturer": "IKEA of Sweden",
    "model_id": "TRADFRI SHORTCUT Button",
    "network_address": 60874,
    "power_source": "Battery",
    "software_build_id": "2.3.015",
    "supported": true,
    "type": "EndDevice"
  },
  {
    "date_code": "20200708",
    "definition": {
      "description": "STYRBAR remote control N2",
      "exposes": [
        {
          "access": 1,
          "description": "Remaining battery in %",
          "name": "battery",
          "property": "battery",
          "type": "numeric",
          "unit": "%",
          "value_max": 100,
          "value_min": 0
        },
        {
          "access": 1,
          "description": "Triggered action (e.g. a button click)",
          "name": "action",
          "property": "action",
          "type": "enum",
          "values": [
            "on",
            "off",
            "brightness_move_up",
            "brightness_move_down",
            "brightness_stop",
            "arrow_left_click",
            "arrow_right_click",
            "arrow_left_hold",
            "arrow_right_hold",
            "arrow_left_release",
            "arrow_right_release"
          ]
        },
        {
          "access": 1,
          "description": "Link quality (signal strength)",
          "name": "linkquality",
          "property": "linkquality",
          "type": "numeric",
          "unit": "lqi",
          "value_max": 255,
          "value_min": 0
        }
      ],
      "model": "E2001/E2002",
      "supports_ota": true,
      "vendor": "IKEA"
    },
    "endpoints": {
      "1": {
        "bindings": [
          {
            "cluster": "genOnOff",
            "target": {
              "id": 901,
              "type": "group"
            }
          },
          {
            "cluster": "genPowerCfg",
            "target": {
              "endpoint": 1,
              "ieee_address": "0x00124b0024c0ebb8",
              "type": "endpoint"
            }
          }
        ],
        "clusters": {
          "input": [
            "genBasic",
            "genPowerCfg",
            "genIdentify",
            "genPollCtrl",
            "touchlink"
          ],
          "output": [
            "genIdentify",
            "genOnOff",
            "genLevelCtrl",
            "genOta",
            "touchlink"
          ]
        },
        "configured_reportings": [
          {
            "attribute": "batteryPercentageRemaining",
            "cluster": "genPowerCfg",
            "maximum_report_interval": 62000,
            "minimum_report_interval": 3600,
            "reportable_change": 0
          }
        ]
      }
    },
    "friendly_name": "big-button-1",
    "ieee_address": "0x842e14fffe8fd0a4",
    "interview_completed": true,
    "interviewing": false,
    "manufacturer": "IKEA of Sweden",
    "model_id": "Remote Control N2",
    "network_address": 62925,
    "power_source": "Battery",
    "software_build_id": "1.0.024",
    "supported": true,
    "type": "EndDevice"
  }
]
*/


import './src/devices2.js'
import './src/actions.js'
import './src/topics.js'
import './src/ZbDevice.js'
import './src/triggers.js'
import './src/lightfix.js'
