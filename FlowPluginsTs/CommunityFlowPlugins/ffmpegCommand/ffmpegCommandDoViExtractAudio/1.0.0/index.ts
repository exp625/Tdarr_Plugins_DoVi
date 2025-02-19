/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
import {
  IffmpegCommandStream,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint-disable no-param-reassign */
const details = ():IpluginDetails => ({
  name: 'Extract Audio from DoVi File',
  description: `
  Extract audio from DoVi file
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
      label: 'Audio languages',
      name: 'audio_languages',
      type: 'string',
      defaultValue: 'eng,de',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify audio languages to keep using comma seperated list e.g. eng,de',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const getOutputStreamIndex = (streams: IffmpegCommandStream[], stream: IffmpegCommandStream): number => {
  let index = -1;

  for (let idx = 0; idx < streams.length; idx += 1) {
    if (!streams[idx].removed) {
      index += 1;
    }

    if (streams[idx].index === stream.index) {
      break;
    }
  }

  return index;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const audio_languages = String(args.inputs.audio_languages).trim().split(',');

  args.variables.ffmpegCommand.container = 'hevc';
  args.variables.ffmpegCommand.shouldProcess = true;

  const audio_dir = `${args.workDir}/sub_streams`;
  const { streams } = args.variables.ffmpegCommand;

  const audioTracks: Record<string, string[]> = {};

  streams.forEach((stream) => {
    const index = getOutputStreamIndex(streams, stream);
    if (stream.codec_type === 'audio' && ['dca', 'truehd'].includes(stream.codec_name)) {
      let lang = stream.tags?.language ? stream.tags.language : 'und';
      const format = stream.codec_name.toLowerCase();
      const dir = audio_dir;

      if (audio_languages.length !== 0 && !audio_languages.includes(lang)) {
        stream.removed = true;
      } else {
        // eslint-disable-next-line no-prototype-builtins
        if (stream.hasOwnProperty('disposition')) {
          const def = stream.disposition.default === 1 ? '.default' : '';
          const forced = stream.disposition.forced === 1 ? '.forced' : '';
          lang = `${lang}${def}${forced}`;
        }

        args.deps.fsextra.ensureDirSync(dir);
        if (!audioTracks[lang]) {
          audioTracks[lang] = [];
        }
        audioTracks[lang].push(`-map 0:${stream.index}`);
      }
    } else {
      stream.removed = true;
    }
  });

  Object.keys(audioTracks).forEach((lang) => {
    const audioFile = `${audio_dir}/audio_${lang}.mka`;
    args.variables.ffmpegCommand.overallOuputArguments.push(...audioTracks[lang], '-c:a copy', audioFile);
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
