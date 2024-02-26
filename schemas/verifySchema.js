const { Schema, model } = require('mongoose');

const verify = new Schema({
    guildId: {
        type: String
    },

    roleId: {
        type: String
    }
});

module.exports = model('verifySchema', verify);