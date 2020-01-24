const express = require("express");
const expressGraphQL = require("express-graphql");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const schema = require("./graphql/index");

const app = express();
const PORT = process.env.PORT || "3000";
const db = 'mongodb://127.0.0.1:27017/test';

// Connect to MongoDB with Mongoose.
mongoose.connect(
    db,
    {
      useCreateIndex: true,
      useNewUrlParser: true 
    }
  )
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

app.use(
    "/graphql",
    cors(),
    bodyParser.json(),
    expressGraphQL({
      schema,
      graphiql: true
    })
  );
  
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
