const id = `ObjectId("6818ee7f3149676a58ffe2fc")`;
console.log(id.split(`ObjectId("`)[1].replace('")', ""));
