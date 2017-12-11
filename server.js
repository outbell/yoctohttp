require('yoctolib-es2017/yocto_api.js');
require('yoctolib-es2017/yocto_cellular.js');

YAPI.LogUnhandledPromiseRejections();
// We create an HTTP server...
var http = require('http');
async function HttpCallbackHandler(message, response) {
    // Here you can filter the requests by URL if you want
    console.log('Received ' + message.method + ' request for ' + message.url);

    // The part below starts the Yoctopuce library in HTTP Callback mode and interacts
    // with modules connected on the VirtualHub or YoctoHub that made the HTTP request
    let errmsg = new YErrorMsg();
    let yctx = new YAPIContext();
    if(await yctx.RegisterHubHttpCallback(message, response, errmsg) != YAPI.SUCCESS) {
        console.log('HTTP callback error: '+errmsg);
        response.write('Error: '+errmsg);
        response.end();
        yctx.FreeAPI();
        return;
    }
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('HTTP callback start<br>\n');

    // Display a list of modules on incoming hub to the Node.js console
    await yctx.UpdateDeviceList(errmsg);
    var module = YModule.FirstModuleInContext(yctx);
    while(module) {
        var msg = (await module.get_serialNumber()) + ' (' + (await module.get_productName()) + ')';
        console.log(msg);
        response.write(msg+'<br>\n');
        module = module.nextModule();
    }
    let sensor = YSensor.FirstSensorInContext(yctx);
    while(sensor) {
        console.log('Sensor: ' + (await sensor.get_hardwareId()));
        console.log('Vale: '+(await sensor.get_currentValue()));
        // await sensor.set_reportFrequency("6/m");
        // await sensor.registerTimedReportCallback(sensorCallback);
        sensor = sensor.nextSensor();
    }
     let cell = YCellular.FirstCellularInContext(yctx);
    while(cell)
    {
        console.log('Operator: '+(await cell.get_cellOperator()));
        console.log('Details: '+(await cell.get_cellIdentifier()));
        cell=cell.nextCellular();
    }
    yctx.FreeAPI();

    response.write('HTTP callback completed<br>\n');
    response.end();
}

process.on('unhandledRejection', function(reason, p) {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});
var port = process.env.PORT || 8044;
// Instantiate a simple HTTP server
http.createServer(HttpCallbackHandler).listen(port);

console.log('Node.js HTTP Callback server running at '+port);




