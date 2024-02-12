const express = require("express");
const http = require("http");
const request = require("request");
require("dotenv/config");

const app = express();
const server = http.createServer(app);
const CONTRACT_IDS = process.env.CONTRACT_IDS.split(/,\s/gi);
const { HOST_AND_PORT, METHOD, NEED_REPRINT, SAMPLE } = process.env;

let flags = [];
const data = {
  contractId: "",
  htmlPathName: "HTMLMAILPATH",
  needReprint: NEED_REPRINT,
  sample: SAMPLE,
};
const resArr = [];

function getReport(arr) {
  arr.forEach((element) => {
    let str = `По ${element.counter} договор`;
    if (element.data.length === 1) {
      str += `у: ${element.data[0]} пришел ответ `;
    } else {
      str += `ам: ${element.data.join(", ")} пришли ответы `;
    }
    str += `с кодом: ${element.code} и текстом: \n${element.message}\n`;
    console.log(str);
  });
}

function checkFlags() {
  if (
    flags.length === CONTRACT_IDS.length &&
    !flags.some((flag) => flag === false)
  ) {
    const res = resArr.reduce((p, i) => {
      if (!p) {
        p = [];
      }
      if (!p.some((el) => el.code === i.data.status.code)) {
        const data = {
          code: i.data.status.code,
          message: i.data.status.text,
          data: [i.id],
          counter: 1,
        };
        p.push(data);
      } else if (p.some((el) => el.code === i.data.status.code)) {
        if (!p.some((el) => el.message === i.data.status.text)) {
          const data = {
            code: i.data.status.code,
            message: i.data.status.text,
            data: [i.id],
            counter: 1,
          };
          p.push(data);
        } else {
          const cur = p.find(
            (el) =>
              el.code === i.data.status.code &&
              el.message === i.data.status.text
          );
          cur.data.push(i.id);
          cur.counter++;
        }
      }
      return p;
    }, []);
    getReport(res);
  }
}
function sender(index) {
  flags.push(false);
  const dataId = data.contractId;
  const url =
    `http://${HOST_AND_PORT}/print-service-gate/${METHOD}`;
  request(
    {
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
    (error, response) => {
      resArr.push({ id: dataId, data: JSON.parse(response.body) });
      flags[index] = true;
      checkFlags();
    }
  );
}

for (let i = 0; i < CONTRACT_IDS.length; i++) {
  data.contractId = "" + CONTRACT_IDS[i];
  sender(i);
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}, please wait response`);
});
