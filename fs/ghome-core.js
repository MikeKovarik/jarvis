let deviceId = Cfg.get('device.id');
let hostname = 'jarvis-iot-' + deviceId;

let traitOnOff        = Cfg.get('ghome.traits.OnOff');
let traitBrightness   = Cfg.get('ghome.traits.Brightness');
let traitColorSetting = Cfg.get('ghome.traits.ColorSetting');