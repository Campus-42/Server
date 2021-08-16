const axios = require("axios").default;

exports.HTML = {
  convertToHtml: async function (url) {
    /**
     * Get the url and convert it to html data.
     * @returns html code
     */

    return axios(url)
      .then(({ data: html }) => {
        return html;
      })
      .catch((error) => {
        throw error;
      });
  },
};
