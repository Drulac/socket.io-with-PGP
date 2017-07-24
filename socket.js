/*(async()=>{
let pgp = new OpenPGP();
let keys = await pgp.generateKeys(512, { name:'Jon Smith', email:'jon@example.com' }, "secret passphrase")

console.log(keys.privateKey);
console.log(keys.publicKey);

let encrypted = await pgp.encrypt("hello world", keys.publicKey, true);
console.log(encrypted)

let decrypted = await pgp.decryptAndVerifySignature(encrypted, keys.publicKey);
console.log(decrypted);
})();*/

module.exports = function(socket, cb, keys, correspondantPublicKey){

	this.socket = socket;
	this.correspondantPublicKey = correspondantPublicKey;
	this.keys = keys;

	var otherPublicKey = null;
	const events = new (require('events'));
	const OpenPGP = require("openpgp-wrapper");
	const pgp = new OpenPGP();

	var haveSendKey = false;
	var haveReceiveKey = false;

	if(this.keys != null)
	{
		this.sendKey();
	}

	//512, { name:'Jon Smith', email:'jon@example.com' }, "secret passphrase"
	this.generateKeys = async (keyLen, userIds, passphrase)=>{
		this.keys = await pgp.generateKeys(keyLen, userIds, passphrase);
		this.sendKey();
	}

	this.sendKey = ()=>{
		this.socket.emit("publicKey", this.keys.publicKey);
		haveSendKey = true;

		if(haveReceiveKey)
		{
			cb(this);
		}
	}

	this.socket.on("publicKey", (key)=>{
		if(correspondantPublicKey != null && correspondantPublicKey != key)
		{
			this.socket.disconnect();
			throw new Error("Other have send a key different than the key you have give");
		}else{
			otherPublicKey = key;
			haveReceiveKey = true;

			if(haveSendKey)
			{
				cb(this);
			}
		}
	});

	this.socket.on("encryptedMessage", async (encryptedMessage)=>{
		if(haveSendKey && haveReceiveKey)
		{
			let decrypted = await pgp.decryptAndVerifySignature(encryptedMessage, otherPublicKey);
			if(decrypted.valid === true)
			{
				decrypted = JSON.parse(decrypted.data);
				events.emit(decrypted.event, decrypted.data);
			}else{
				throw new Error("The correspondant is not him, the signature is invalid");
			}
		}
	});

	this.on = (event, cb)=>{
		events.on(event, cb);
	};

	this.emit = async (event, data)=>{
		if(haveSendKey)
		{
			if(haveReceiveKey)
			{
				let encrypted = await pgp.encrypt(JSON.stringify({event: event, data: data}), otherPublicKey, true);

				this.socket.emit("encryptedMessage", encrypted);
			}else{
				throw new Error("We havn't receive correspondant public key, please wait and see...");
			}
		}else{
			throw new Error("You must generate keys or pass keys as arguments");
		}
	};
}