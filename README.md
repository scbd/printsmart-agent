### Installing

Clone and install.

```
cd ~
git clone https://github.com/scbd/printsmart-agent
cd printsmart-agent
npm install
```

Under folder `$HOME`, place a file named `config.json` containing valid __AWS Keys__ .

```
cd ~
nano config.json
```

```

### Sample config file

```javascript
{
    "aws": {
        "accountId": "12345674869",
        "accessKeyId": "SECRET",
        "secretAccessKey": "SECRET"
    },
    "queues" : {
        "print"           : "PrintSmart_print",
        "reportJobStatus" : "PrintSmart_jobStatusReport",
        "updateJobStatus" : "PrintSmart_updateJobStatus_{instanceId}"
    },
    "printers" : {
        "ps1" : {
            "endpoint"    : "ipp://0.0.0.1/ipp",
            "driver"      : "drv:///sample.drv/generic.ppd",
            "description" : "PrintSmart",
            "location"    : "Doc Distribution"
        },
        "ps2" : {
            "endpoint"    : "ipp://0.0.0.2/ipp",
            "driver"      : "drv:///sample.drv/generic.ppd",
            "description" : "PrintSmart",
            "location"    : "Doc Distribution"
        },
        "ps3" : {
            "endpoint"    : "ipp://0.0.0.3/ipp",
            "driver"      : "drv:///sample.drv/generic.ppd",
            "description" : "PrintSmart-Backup",
            "location"    : "Doc Distribution"
        }
    },
    "classes" : {
        "default"   : ["ps1", "ps2"],
        "printshop" : ["ps1", "ps2"]
    }
}
```

### Updating

Pull changes and re-install.

```
cd ~/printsmart-agent
git pull
npm install
```

If required, restart.

```
forever restartall
```

### Running

Start (via `forever`).

```
cd ~/printsmart-agent
forever main
```
