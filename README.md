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
