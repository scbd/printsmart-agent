### Installing

Clone and install.

```
cd ~
git clone git@githiub.com:scbd/printsmart-agent
cd printsmart-agent
npm install
```

Under folder `$HOME`, place a file named `config.json` containing valid __AWS Keys__ .

```
cd ~
nano config.json
```

```
{
	"awsAccessKeys": {
		"global": {
			"accessKeyId": "XXXXXXXXXX",
			"secretAccessKey": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
		}
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
