const { Schema, model } = require("mongoose");

const codes = new Schema({
    userId: {
        type: String
    },

    captchaCode: {
        type: String
    }
})

module.exports = model("codesSchema", codes)