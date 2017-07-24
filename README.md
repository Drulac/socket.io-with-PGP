# socket.io-with-PGP
transparent socket.io surcouche who encrypt and sign your messages transparently

```js
var io = require('socket.io')(6336);
var SocketWithPGP = require('socket.io-with-pgp');
var SocketWithGet = require('socket.io-with-get');

try{
	(async ()=>{

		io.on('connection', async function(socket){
			let client = new SocketWithPGP(socket, async (client)=>{
				client = new SocketWithGet(client);

				client.on('ping', (data, cb)=>{
					cb(data);
				});

				client.get("name", {}, (err, data)=>{
					console.log(data);
				});
			});

			await client.generateKeys(512, { name:'Jon Smith', email:'jon@example.com' }, "secret passphrase");
		});


		var soc = require('socket.io-client')('http://localhost:6336');
		let socket = new SocketWithPGP(soc, async (soc)=>{

			socket = new SocketWithGet(socket);

			socket.get("ping", {start: new Date().getTime()}, (err, data)=>{
				let pingTime = new Date().getTime() - data.start;
				console.log(pingTime+" ms");
			});

			socket.on('name', (data, cb)=>{
				cb("My name is Jhon... Jhon Doe...");
			});
		});
		await socket.generateKeys(512, { name:'Jon Smith', email:'jon@example.com' }, "secret passphrase");

	})();
}catch(e){
	throw e;
}
```
