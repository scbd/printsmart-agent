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
    "postscript" : {
        "level" : 1,
        "paper" : "letter"
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

### SSH Reverse tunnel connection
```
ssh -A -L 21631:localhost:631 -o "ProxyCommand=ssh -A user@public.server netcat localhost 2122" psu@localhost -p 2122 $@
```

### Uselfull CUPS Command lines

List drivers
```
$ lpinfo -m
```

List printer
```
lpstat -p
```

Add printer
```
$ lpadmin -p ps1 -v ipp://printer1.local/ipp -E -m drv:///sample.drv/generic.ppd -D "PrintSmart" -L 'Doc Distribution'
$ lpadmin -p ps2 -v ipp://printer2.local/ipp -E -m drv:///sample.drv/generic.ppd -D "PrintSmart" -L 'Doc Distribution'
$ lpadmin -p ps3 -v ipp://printer3.local/ipp -E -m drv:///sample.drv/generic.ppd -D "PrintSmart Backup" -L 'Doc Distribution'
```
* `raw` No driver (Direct print)
* `everywhere` Query printer for driver (if available)
* `drv:///sample.drv/generic.ppd` - Generic PostScript Printer
* `drv:///sample.drv/generpcl.ppd` - Generic PCL Laser Printer

Remove printer
```
$ lpadmin -r ps3

```

Lits printers in a class
```
$ lpstat -c default
```

Add printers to a class
```
$ lpadmin -p ps1 -c default
$ lpadmin -p ps2 -c default
$ lpadmin -p ps3 -c default
$ cupsenable default
$ cupsaccept default
```

Remove printers from a class
```
$ lpadmin -p ps3 -r default
```
