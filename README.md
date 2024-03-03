![DBT Image](https://github.com/57tr/djs-advanced-verification/assets/96021196/a0ef7149-3b85-43ab-a816-2f9a60595ea1)

# djs-advanced-verification
This is an advanced verification system with a database for different guilds, it is easy to use and adapt. You can prevent raids on your discord and bot injections.

<a href="https://github.com/57tr/djs-advanced-verification"><img src= "https://img.shields.io/github/stars/57tr/djs-advanced-verification?style=for-the-badge"/></a>
<a href="https://github.com/57tr"><img src="https://img.shields.io/github/followers/57tr?style=for-the-badge"/></a>

## Dependencies:
> The dependencies used are [discord.js](https://discord.js.org/#/), [mongoose](https://www.npmjs.com/package/mongoose) and [captcha-canvas](https://www.npmjs.com/package/captcha-canvas).
```bash
npm i discord.js mongoose captcha-canvas
```

# Instructions:
> 1. Put the slash commands in your slash commands folder.
> 2. Put the events in your event folder.
> 3. Create a new folder in the root directory of the bot and name it "schemas", and then put all the schemas there.
> 4. Change all paths to the correct ones if necessary.

# MongoDB Connection:
> To connect to mongodb with your discord bot make sure to add this to your ready.js event or index.js file.
```js
// Add this to the top of the file
const { connect } = require("mongoose");

// Add this to your ready.js or index.js file
await connect(MONGO_URI).then(() => {
    console.log(`Successfully connected to MongoDB!`);
}).catch((error) => {
    console.log(`Error connecting to MongoDB!`, error);
});
```

# Preview
https://github.com/57tr/djs-advanced-verification/assets/96021196/9e2cda2a-a529-4c90-a2b1-1801d954409a

# Contributing:
> If you want to contribute create a fork of this project and when you are done editing it update the fork and create a pull request.
