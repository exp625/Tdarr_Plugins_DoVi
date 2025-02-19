/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import {
  IffmpegCommandStream,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint-disable no-param-reassign */
const details = ():IpluginDetails => ({
  name: 'Extract Subtitles from DoVi File',
  description: `
  Extract subtitles from DoVi file and convert all possible types to srt format.
  Picture based subtitles will be stored in a .mks file.
  `,
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Subtitle languages',
      name: 'subtitle_languages',
      type: 'string',
      defaultValue: 'eng,de',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify subtitle languages to keep using comma seperated list e.g. eng,hun',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const getOuputStreamIndex = (streams: IffmpegCommandStream[], stream: IffmpegCommandStream): number => {
  let index = -1;

  for (let idx = 0; idx < streams.length; idx += 1) {
    if (!stream.removed) {
      index += 1;
    }

    if (streams[idx].index === stream.index) {
      break;
    }
  }

  return index;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const subtitle_languages = String(args.inputs.subtitle_languages).trim().split(',');

  args.variables.ffmpegCommand.container = 'hevc';
  args.variables.ffmpegCommand.shouldProcess = true;

  const subs_dir = `${args.workDir}/sub_streams`;
  const { streams } = args.variables.ffmpegCommand;

  const pictureFormats = ['hdmv_pgs_subtitle', 'dvd_subtitle'];
  const textFormats = ['ass', 'subrip', 'srt'];

  const pictureSubtitles: Record<string, string[]> = {};

  streams.forEach((stream) => {
    const index = getOuputStreamIndex(streams, stream);
    if (stream.codec_type === 'subtitle') {
      let lang = stream.tags?.language ? stream.tags.language : 'und';
      const format = stream.codec_name.toLowerCase();
      const dir = subs_dir;

      if (textFormats.includes(format)) {
        if (subtitle_languages.length !== 0 && !subtitle_languages.includes(lang)) {
          stream.removed = true;
        } else {
          // eslint-disable-next-line no-prototype-builtins
          if (stream.hasOwnProperty('disposition')) {
            const def = stream.disposition.default === 1 ? '.default' : '';
            const forced = stream.disposition.forced === 1 ? '.forced' : '';
            const sdh = stream.disposition.hearing_impaired === 1 ? '.sdh' : '';
            lang = `${lang}${def}${forced}${sdh}`;
          }

          args.deps.fsextra.ensureDirSync(dir);
          stream.outputArgs.push('-c:s:0');
          stream.outputArgs.push(format === 'ass' ? 'srt' : 'copy');
          stream.outputArgs.push(`${dir}/${index}.${lang}.srt`);
        }
      } else if (pictureFormats.includes(format)) {
        if (!pictureSubtitles[lang]) {
          pictureSubtitles[lang] = [];
        }
        pictureSubtitles[lang].push(`-map 0:${stream.index}`);
        stream.removed = true;
      } else {
        stream.removed = true;
      }
    } else {
      stream.removed = true;
    }
  });

  Object.keys(pictureSubtitles).forEach((lang) => {
    const mksFile = `${subs_dir}/picture_subs_${lang}.mks`;
    args.variables.ffmpegCommand.overallOuputArguments.push(...pictureSubtitles[lang], '-c:s copy', mksFile);
  });

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
