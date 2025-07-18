const router = require("express").Router();
const fs = require("fs");
const path = require("path");

router.get("/checkauth", async (req, res) => {
  client
    .getState()
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((err) => {
      if (err) {
        res.send("DISCONNECTED");
      }
    });
});

router.get("/getqr", async (req, res) => {
  client
    .getState()
    .then((data) => {
      if (data) {
        res.write("<html><body><h2>Already Authenticated</h2></body></html>");
        res.end();
      } else sendQr(res);
    })
    .catch(() => sendQr(res));
});

function sendQr(res) {
  const qrPath = path.join(__dirname, "last.qr");

  fs.readFile(qrPath, (err, last_qr) => {
    if (!err && last_qr) {
      const page = `
        <html>
          <body>
            <div id="qrcode"></div>
            <script type="module">
              import QrCreator from "https://cdn.jsdelivr.net/npm/qr-creator/dist/qr-creator.es6.min.js";
              let container = document.getElementById("qrcode");
              QrCreator.render({
                text: "${last_qr}",
                radius: 0.5,
                ecLevel: "H",
                fill: "#536DFE",
                background: null,
                size: 256,
              }, container);
            </script>
          </body>
        </html>`;
      res.write(page);
      res.end();
    } else {
      res.write("<html><body><h2>QR no disponible aún...</h2></body></html>");
      res.end();
    }
  });
}

module.exports = router;
