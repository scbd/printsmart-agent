# SCBD PrintSmart

SCBD PrintSmart Agent Sends Print-on-Demand request to venue PrintSmart-enabled printers.

### Build & Run

Build
```
$ docker build -t printsmart-agent git@github.com:scbd/printsmart-agent.git
```

Run (daemon)
```
$ docker run -d --name ps --restart always -e INSTANCE_ID=$(hostname) -v /path/to/config/config.json:/config/config.json -p 631:631 scbd/printsmart-agent
```

Logs
```
$ docker logs -f ps
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
$ ssh -A -L 21631:localhost:631 -o "ProxyCommand=ssh -A user@public.server netcat localhost 2122" ubuntu@localhost -p 2122 $@
```
auto ssh
```
$ sudo nano /etc/systemd/system/autossh-tunnel.service
```
autossh-tunnel.service
```
[Unit]
Description=SSH reverse tunnel service
After=network.target

[Service]
Environment="AUTOSSH_GATETIME=0"
ExecStart=/usr/bin/autossh -M 0 -N -i /home/ubuntu/.ssh/id_rsa -o StrictHostKeyChecking=no -R 2122:localhost:22 user@public.server -v

[Install]
WantedBy=multi-user.target
```

```
$ sudo systemctl daemon-reload
$ sudo systemctl start autossh-tunnel.service
$ sudo systemctl enable autossh-tunnel.service
$ sudo systemctl status autossh-tunnel
```

### Useful CUPS Command lines

List drivers
```
$ lpinfo -m
```

List printer
```
$ lpstat -p
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

# Setup server (ubuntu 16.04)

No password SUDO
```
$ visudo
  %sudo   ALL=(ALL:ALL) NOPASSWD: ALL
```

mutlicast DNS, autossh etc
```
$ sudo apt-get update
$ sudo apt-get install libnss-mdns autossh apt-transport-https ca-certificates curl software-properties-common
```


No password and pubkey for ssh
```
$ sudo nano /etc/ssh/sshd_config
  PubkeyAuthentication yes
  PasswordAuthentication no
```

Docker
```
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
$ sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
$ sudo apt-get update
$ sudo apt-get install docker-ce

```
