const router = require('express').Router();
const { MessageMedia, Location } = require("whatsapp-web.js");
const request = require('request');
const vuri = require('valid-url');
const fs = require('fs');

const mediadownloader = (url, path, callback) => {
  request.head(url, (err, res, body) => {
    request(url)
      .pipe(fs.createWriteStream(path))
      .on('close', callback);
  });
};

router.post('/sendmessage/:phone', async (req, res) => {
  const phone = req.params.phone;
  const message = req.body.message;

  if (!phone || !message) {
    return res.send({ status: "error", message: "please enter valid phone and message" });
  }

  client.sendMessage(`${phone}@c.us`, message).then((response) => {
    if (response?.id?.fromMe) {
      res.send({ status: 'success', message: `Message successfully sent to ${phone}` });
    } else {
      res.send({ status: 'warning', message: `Message sent but not confirmed.` });
    }
  }).catch((err) => {
    res.send({ status: 'error', message: `sendMessage error: ${err.message}` });
  });
});

router.post('/sendimage/:phone', async (req, res) => {
  const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  const phone = req.params.phone;
  const image = req.body.image;
  const caption = req.body.caption || '';

  if (!phone || !image) {
    return res.send({ status: "error", message: "please enter valid phone and base64/url of image" });
  }

  if (base64regex.test(image)) {
    const media = new MessageMedia('image/png', image);
    client.sendMessage(`${phone}@c.us`, media, { caption }).then((response) => {
      if (response?.id?.fromMe) {
        res.send({ status: 'success', message: `Image sent to ${phone}` });
      } else {
        res.send({ status: 'warning', message: `Image sent but not confirmed.` });
      }
    }).catch((err) => {
      res.send({ status: 'error', message: `sendImage error: ${err.message}` });
    });
  } else if (vuri.isWebUri(image)) {
    if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');

    const path = './temp/' + image.split("/").pop();
    mediadownloader(image, path, () => {
      const media = MessageMedia.fromFilePath(path);
      client.sendMessage(`${phone}@c.us`, media, { caption }).then((response) => {
        if (response?.id?.fromMe) {
          res.send({ status: 'success', message: `Image sent to ${phone}` });
        } else {
          res.send({ status: 'warning', message: `Image sent but not confirmed.` });
        }
        fs.unlinkSync(path);
      }).catch((err) => {
        res.send({ status: 'error', message: `sendImage error: ${err.message}` });
      });
    });
  } else {
    res.send({ status: 'error', message: 'Invalid URL/Base64 Encoded Media' });
  }
});

router.post('/sendpdf/:phone', async (req, res) => {
  const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  const phone = req.params.phone;
  const pdf = req.body.pdf;

  if (!phone || !pdf) {
    return res.send({ status: "error", message: "please enter valid phone and base64/url of pdf" });
  }

  if (base64regex.test(pdf)) {
    const media = new MessageMedia('application/pdf', pdf);
    client.sendMessage(`${phone}@c.us`, media).then((response) => {
      if (response?.id?.fromMe) {
        res.send({ status: 'success', message: `PDF sent to ${phone}` });
      } else {
        res.send({ status: 'warning', message: `PDF sent but not confirmed.` });
      }
    }).catch((err) => {
      res.send({ status: 'error', message: `sendPDF error: ${err.message}` });
    });
  } else if (vuri.isWebUri(pdf)) {
    if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');

    const path = './temp/' + pdf.split("/").pop();
    mediadownloader(pdf, path, () => {
      const media = MessageMedia.fromFilePath(path);
      client.sendMessage(`${phone}@c.us`, media).then((response) => {
        if (response?.id?.fromMe) {
          res.send({ status: 'success', message: `PDF sent to ${phone}` });
        } else {
          res.send({ status: 'warning', message: `PDF sent but not confirmed.` });
        }
        fs.unlinkSync(path);
      }).catch((err) => {
        res.send({ status: 'error', message: `sendPDF error: ${err.message}` });
      });
    });
  } else {
    res.send({ status: 'error', message: 'Invalid URL/Base64 Encoded PDF' });
  }
});

router.post('/sendlocation/:phone', async (req, res) => {
  const phone = req.params.phone;
  const { latitude, longitude, description } = req.body;

  if (!phone || !latitude || !longitude) {
    return res.send({ status: "error", message: "please enter valid phone, latitude and longitude" });
  }

  const loc = new Location(latitude, longitude, description || "");
  client.sendMessage(`${phone}@c.us`, loc).then((response) => {
    if (response?.id?.fromMe) {
      res.send({ status: 'success', message: `Location sent to ${phone}` });
    } else {
      res.send({ status: 'warning', message: `Location sent but not confirmed.` });
    }
  }).catch((err) => {
    res.send({ status: 'error', message: `sendLocation error: ${err.message}` });
  });
});

router.get('/getchatbyid/:phone', async (req, res) => {
  const phone = req.params.phone;
  if (!phone) {
    return res.send({ status: "error", message: "please enter valid phone number" });
  }

  client.getChatById(`${phone}@c.us`).then((chat) => {
    res.send({ status: "success", message: chat });
  }).catch(() => {
    res.send({ status: "error", message: "getchaterror" });
  });
});

router.get('/getchats', async (req, res) => {
  client.getChats().then((chats) => {
    res.send({ status: "success", message: chats });
  }).catch(() => {
    res.send({ status: "error", message: "getchatserror" });
  });
});

module.exports = router;
