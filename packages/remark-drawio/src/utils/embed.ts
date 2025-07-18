// transplanted from https://github.com/jgraph/drawio-tools/blob/d46977060ffad70cae5a9059a2cbfcd8bcf420de/tools/convert.html
import pako from 'pako';

const unconpressedDataRegexp = /<mxGraphModel/;
const validateUncompressedData = (input: string): boolean => {
  return unconpressedDataRegexp.test(input);
};

const validateCompressedData = (input: string): boolean => {
  let data = input;

  try {
    data = Buffer.from(data, 'base64').toString('binary');
  } catch (e) {
    throw new Error(`Base64 to binary failed: ${e}`);
  }

  if (data.length > 0) {
    try {
      data = pako.inflateRaw(
        Uint8Array.from(data, (c) => c.charCodeAt(0)),
        { to: 'string' },
      );
    } catch (e) {
      throw new Error(`inflateRaw failed: ${e}`);
    }
  }

  try {
    data = decodeURIComponent(data);
  } catch (e) {
    throw new Error(`decodeURIComponent failed: ${e}`);
  }

  return true;
};

const escapeHTML = (string): string => {
  if (typeof string !== 'string') {
    return string;
  }
  return string.replace(/[&'`"<>]/g, (match): string => {
    return (
      {
        '&': '&amp;',
        "'": '&#x27;',
        '`': '&#x60;',
        '"': '&quot;',
        '<': '&lt;',
        '>': '&gt;',
      }[match] ?? match
    );
  });
};

export const generateMxgraphData = (code: string): string => {
  const trimedCode = code.trim();
  if (!trimedCode) {
    return '';
  }

  // Evaluate the code is whether uncompressed data that are generated by v21.1.0 or above
  // see: https://github.com/jgraph/drawio/issues/3106#issuecomment-1479352026
  const isUncompressedData = validateUncompressedData(trimedCode);
  if (!isUncompressedData) {
    validateCompressedData(trimedCode);
  }

  const xml = `
    <mxfile version="6.8.9" editor="www.draw.io" type="atlas">
      <mxAtlasLibraries/>
      <diagram>${trimedCode}</diagram>
    </mxfile>
  `;

  const mxGraphData = {
    editable: false,
    highlight: '#0000ff',
    nav: false,
    toolbar: null,
    edit: null,
    resize: true,
    lightbox: 'false',
    xml,
    'dark-mode': 'auto',
  };

  return escapeHTML(JSON.stringify(mxGraphData));
};
