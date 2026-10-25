#! /usr/bin/env node

const
    vuegHelp            = require("./services/vueg-help"),
    vuegComponentHelp   = require("./services/vueg-component-help");

////////////////////////////////////////////////
/**
 *  @description    Get value of a flag
 */
function getValueof(args, flag, obj = Object) {
    let thatValue   = null,  
        match       = false;
    args.forEach(arg => {
        if(match)
            thatValue = arg.startsWith("--") || arg.startsWith("-") || arg;
        match = (arg == flag);
    });
    // Flag passed as last argument
    if(match)
        thatValue = true;
    return thatValue;
}
////////////////////////////////////////////////
////////////////////////////////////////////////
const DEACTIVATE = false;
////////////////////////////////////////////////


const 
    pathLaunchedCmd     = process.cwd(), 
    allArgs             = process.argv, 
    nodeFile            = allArgs[0], 
    vuegFile            = allArgs[1], 
    serviceArg          = allArgs[2], 
    args                = allArgs.slice(3), 
    requiredArgs        = {
        name:   getValueof(args, "--name", String), 
    }, 
    serviceArgs         = {
        help:       serviceArg == 'help' || !serviceArg
                || getValueof(args, "--help", Boolean) 
                || getValueof(args, "-h", Boolean) 
                || args.length == 0, 
        component:  serviceArg == 'component', 
        view:       DEACTIVATE && serviceArg == 'view', 
    }, 
    optionalArgs        = {
        template:   {
            // 
        }, 
        script:     {
            // 
        }, 
        style:      {
            scoped: getValueof(args, "--scoped", Boolean) !== "false", 
            style:  getValueof(args, "--style", String)   || "scss", 
        }
    };

switch(true) {
    case serviceArgs.component: 
        vuegComponentHelp();
        break;
    case !!serviceArgs.help:
    default: 
        vuegHelp();
}
