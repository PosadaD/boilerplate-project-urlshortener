require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const dns = require('dns');

mongoose.connect(process.env.MONGO_URI)


const urlSchema = new mongoose.Schema({
  original_url:{
    type: String,
    required: true,
    unique: true
  },
  short_url:{
    type: Number,
    required: true
  }
})


const URLs = mongoose.model("url", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(express.urlencoded({ extended: true }))
app.use(express.json());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});





// Your first API endpoint
app.route('/api/shorturl')
.post ((req, res)=>{

  req.url = req.body.url

  const parsedUrl = new URL(req.url);
  const hostname = parsedUrl.hostname;

  dns.lookup(hostname, async(err) => {

    if (err && err.code === 'ENOTFOUND') {
      res.json({ error: 'invalid url' });
    }else{
      
      try {
        const savedURL = await URLs.findOne({ original_url: req.url}).select("short_url");

        if(savedURL){
          req.short = savedURL.short_url
        }else{
          const ultimaURL = await URLs.findOne().sort({ _id: -1 }).limit(1).select("short_url");
          if(ultimaURL === null) req.short = 1;
          else{
            req.short = ultimaURL.short_url + 1;
          }

          let newURL = new URLs({
            original_url: `${req.url}`,
            short_url: req.short
          })

          
          try{
            newURL.save() 
            console.log("Nueva URLs guardada")
          }catch(error){
            if(error) return console.log(error)
          }        
        }

      } catch (err) {
        console.error(err);
      }
      
      res.json({ 
        original_url: `${req.url}`,
        short_url: req.short
      });
    }
  });

})

app.get("/api/shorturl/:data", async (req, res)=>{
  
  const shortUrl = parseInt(req.params.data);
  const searchUrl = await URLs.findOne({short_url: shortUrl})
  if(searchUrl){
    res.redirect(searchUrl.original_url)
  }else{
    res.json({
      error:	"No short URL found for the given input"
    })
  }
})





app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
