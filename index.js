class TeltonikaParserUdp {
    packetLength;
    packetId;
    packetType;
    avlPacketId;
    imeiLength;
    imei;
    data = { codecId: null, avlDataCount: null, avlData: [] };
    constructor(packet) {
        this.packetLength = parseInt('0x' + packet.substring(0, 4));
        this.packetId = parseInt('0x' + packet.substring(4, 8));
        this.packetType = parseInt('0x' + packet.substring(8, 10));
        this.avlPacketId = parseInt('0x' + packet.substring(10, 12));
        this.imeiLength = parseInt('0x' + packet.substring(12, 16));
        var index = this.imeiLength * 2;
        this.imei = this.hex2a(packet.substr(16, index));
        this.data.codecId = parseInt('0x' + packet.substr(index + 16, 2));
        this.data.avlDataCount = parseInt('0x' + packet.substr(index + 18, 2));
        var avlRaw = packet.substr(index + 20, packet.length - (index + 22));
        var avlLength = avlRaw.length / this.data.avlDataCount;
        var avlRawArray = avlRaw.match(this.stringToRegex(`/.{1,${avlLength}}/g`));
        avlRawArray.forEach(item => {
            var obj = { ioElements: [] };
            obj.timestamp =this.formatDate(parseInt('0x' + item.substr(0, 16)));
            obj.priority = parseInt('0x' + item.substr(16, 2));
            obj.gps = {};
            obj.gps.longitude = parseInt('0x' + item.substr(18, 8));
            obj.gps.latitude = parseInt('0x' + item.substr(26, 8));
            obj.gps.altitude = parseInt('0x' + item.substr(34, 4));
            obj.gps.angle = parseInt('0x' + item.substr(38, 4));
            obj.gps.satellites = parseInt('0x' + item.substr(42, 2));
            obj.gps.speed = parseInt('0x' + item.substr(44, 4));
            var ioRaw = item.substr(48, item.length - 44);
            obj.event_id = parseInt('0x' + ioRaw.substr(0, 2));
            obj.properties_count = parseInt('0x' + ioRaw.substr(2, 2));
            var eventsLen = Math.ceil(obj.properties_count / 5);
            var ioEvents = ioRaw.substr(4, ioRaw.length - 4);
            var start = 0;
            var end = 1;
            var id = 2;
            var val = 2;
            for (let i = 1; i <= eventsLen; i++) {
                var count = parseInt('0x' + ioEvents.substr(start, 2))
                var io = ioEvents.substr(start + 2, count * id + count * val * end);
                var increment = 0;
                for (let k = 0; k < count; k++) {
                    const property_id = parseInt('0x' + io.substr(increment, 2));
                    const value = parseInt('0x' + io.substr(increment + 2, Math.pow(2, i)));
                    var element = {
                        id: property_id,
                        value: value,
                        label: this.ioElements()[property_id] ? this.ioElements()[property_id].label : "",
                        dimension: this.ioElements()[property_id] ? this.ioElements()[property_id].dimension : "",
                        valueHuman: this.ioElements()[property_id] ? (this.ioElements()[property_id].values ? this.ioElements()[property_id].values[value] : "") : ""
                    }
                    obj.ioElements.push(element);
                   // if (property_id == 239) obj.gps.ignition_status = element;
                    increment = increment + 2 + Math.pow(2, i);
                }
                start = start + count * id + count * val * end + 2;
                end = end * 2;
            }
            this.data.avlData.push(obj);
        });
    }
    stringToRegex = str => {
        // Main regex
        const main = str.match(/\/(.+)\/.*/)[1]

        // Regex options
        const options = str.match(/\/.+\/(.*)/)[1]

        // Compiled regex
        return new RegExp(main, options)
    }
    hex2a(hexx) {
        var hex = hexx.toString();//force conversion
        var str = '';
        for (var i = 0; i < hex.length; i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    }
    formatDate(timestamp) {
        var date = (new Date(timestamp)).toUTCString()
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;
        var arr = date.split(":");
        var hr = arr[0].split(' ');
        var time = hr[hr.length - 1] + ":" + arr[arr.length - 2] + ":" + arr[arr.length - 1];
        return ([year, month, day].join('-') + " " + time).replace('GMT',"").trim();
    }
    ioElements() {
        return {
            1: {
                label: "Din 1",
                values: {
                    0: "0",
                    1: "1"
                }
            },
            10: {
                label: "SD Status",
                values: {
                    0: "Not present",
                    1: "Present"
                }
            },
            11: {
                label: "SIM ICCID1 number"
            },
            12: {
                label: "Fuel Used GPS"
            },
            13: {
                label: "Average Fuel Use",
                dimension: "L / 100 km"
            },
            14: {
                label: "SIM ICCID2 number"
            },
            15: {
                label: "Eco Score"
            },
            16: {
                label: "Total Odometer"
            },
            17: {
                label: "Accelerometer X axis"
            },
            18: {
                label: "Accelerometer Y axis"
            },
            19: {
                label: "Accelerometer Z axis"
            },
            20: {
                label: "BLE 2 Battery Voltage",
                dimension: "%"
            },
            21: {
                label: "GSM Signal Strength",
                values: {
                    1: "1",
                    2: "2",
                    3: "3",
                    4: "4",
                    5: "5"
                }
            },
            22: {
                label: "BLE 3 Battery Voltage",
                dimension: "%"
            },
            23: {
                label: "BLE 4 Battery Voltage",
                dimension: "%"
            },
            24: {
                label: "Speed",
                dimension: "km/h"
            },
            25: {
                label: "BLE 1 Temperature",
                dimension: "C"
            },
            26: {
                label: "BLE 2 Temperature",
                dimension: "C"
            },
            27: {
                label: "BLE 3 Temperature",
                dimension: "C"
            },
            28: {
                label: "BLE 4 Temperature",
                dimension: "C"
            },
            29: {
                label: "BLE 1 Battery Voltage",
                dimension: "%"
            },
            30: {
                label: "Number of DTC"
            },
            31: {
                label: "Calculated engine load value",
                dimension: "%"
            },
            32: {
                label: "Engine coolant temperature",
                dimension: "C"
            },
            33: {
                label: "Short term fuel trim 1",
                dimension: "%"
            },
            34: {
                label: "Fuel pressure",
                dimension: "kPa"
            },
            35: {
                label: "Intake manifold absolute pressure",
                dimension: "kPa"
            },
            36: {
                label: "Engine RPM",
                dimension: "rpm"
            },
            37: {
                label: "Vehicle speed",
                dimension: "km/h"
            },
            38: {
                label: "Timing advance",
                dimension: "O"
            },
            39: {
                label: "Intake air temperature",
                dimension: "C"
            },
            40: {
                label: "MAF air flow rate",
                dimension: "g/sec, *0.01"
            },
            41: {
                label: "Throttle position",
                dimension: "%"
            },
            42: {
                label: "Run time since engine start",
                dimension: "s"
            },
            43: {
                label: "Distance traveled MIL on",
                dimension: "Km"
            },
            44: {
                label: "Relative fuel rail pressure",
                dimension: "kPa*0.1"
            },
            45: {
                label: "Direct fuel rail pressure",
                dimension: "kPa*0.1"
            },
            46: {
                label: "Commanded EGR",
                dimension: "%"
            },
            47: {
                label: "EGR error",
                dimension: "%"
            },
            48: {
                label: "Fuel level",
                dimension: "%"
            },
            49: {
                label: "Distance traveled since codes cleared",
                dimension: "Km"
            },
            50: {
                label: "Barometric pressure",
                dimension: "kPa"
            },
            51: {
                label: "Control module voltage",
                dimension: "mV"
            },
            52: {
                label: "Absolute load value",
                dimension: "%"
            },
            53: {
                label: "Ambient air temperature",
                dimension: "C"
            },
            54: {
                label: "Time run with MIL on",
                dimension: "min"
            },
            55: {
                label: "Time since trouble codes cleared",
                dimension: "min"
            },
            56: {
                label: "Absolute fuel rail pressure",
                dimension: "kPa*10"
            },
            57: {
                label: "Hybrid battery pack remaining life",
                dimension: "%"
            },
            58: {
                label: "Engine oil temperature",
                dimension: "C"
            },
            59: {
                label: "Fuel injection timing",
                dimension: "O, *0.01"
            },
            60: {
                label: "Engine fuel rate",
                dimension: "L/h, *100"
            },
            66: {
                label: "Ext Voltage",
                dimension: "mV"
            },
            67: {
                label: "Battery Voltage",
                dimension: "mV"
            },
            68: {
                label: "Battery Current",
                dimension: "mA"
            },
            69: {
                label: "GNSS Status",
                values: {
                    0: "OFF",
                    1: "ON with fix",
                    2: "ON without fix",
                    3: "In sleep state"
                }
            },
            80: {
                label: "Data Mode",
                values: {
                    0: "Home On Stop",
                    1: "Home On Moving",
                    2: "Roaming On Stop",
                    3: "Roaming On Moving",
                    4: "Unknown On Stop",
                    5: "Unknown On Moving"
                }
            },
            86: {
                label: "BLE 1 Humidity",
                dimension: "%RH"
            },
            104: {
                label: "BLE 2 Humidity",
                dimension: "%RH"
            },
            106: {
                label: "BLE 3 Humidity",
                dimension: "%RH"
            },
            108: {
                label: "BLE 4 Humidity",
                dimension: "%RH"
            },
            181: {
                label: "PDOP"
            },
            182: {
                label: "HDOP"
            },
            199: {
                label: "Trip Odometer"
            },
            200: {
                label: "Sleep Mode",
                values: {
                    0: "No Sleep",
                    1: "GPS Sleep",
                    2: "Deep Sleep"
                }
            },
            205: {
                label: "GSM Cell ID"
            },
            206: {
                label: "GSM Area Code"
            },
            238: {
                label: "User ID"
            },
            239: {
                label: "Ignition",
                values: {
                    0: "No",
                    1: "Yes"
                }
            },
            240: {
                label: "Movement",
                values: {
                    0: "No",
                    1: "Yes"
                }
            },
            241: {
                label: "GSM Operator"
            },
            243: {
                label: "Green Driving Event Duration",
                dimension: "ms"
            },
            246: {
                label: "Towing Detection Event",
                values: {
                    1: "Send Towing detected"
                }
            },
            247: {
                label: "Crash Detection",
                values: {
                    1: "Crash Detected",
                    2: "Crash Trace Record"
                }
            },
            249: {
                label: "Jamming Detection",
                values: {
                    0: "Jamming Ended",
                    1: "Jamming Detected"
                }
            },
            250: {
                label: "Trip Event",
                values: {
                    0: "Trip Ended",
                    1: "Trip Started",
                    2: "Business Status",
                    3: "Private Status",
                    4: "Custom Statuses",
                    5: "Custom Statuses",
                    6: "Custom Statuses",
                    7: "Custom Statuses",
                    8: "Custom Statuses",
                    9: "Custom Statuses",
                }
            },
            251: {
                label: "Idling Event",
                values: {
                    0: "Idling ended event",
                    1: "Idling started event"
                }
            },
            252: {
                label: "Unplug Event",
                values: {
                    1: "Send when unplug event happens"
                }
            },
            253: {
                label: "Green Driving Type",
                values: {
                    1: "Acceleration",
                    2: "Braking",
                    3: "Cornering"
                }
            },
            254: {
                label: "Green Driving Value",
                dimension: "g*10"
            },
            255: {
                label: "Overspeeding Event",
                dimension: "km/h"
            },
            256: {
                label: "VIN"
            },
        }
    }

}
module.exports = TeltonikaParserUdp;