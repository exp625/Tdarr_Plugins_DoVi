import { getContainer } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
/* eslint-disable no-param-reassign */
const details = () :IpluginDetails => ({
  name: 'DoVi Remux MP4',
  description: `
  If input is MP4, then the video stream from that with other streams from original file into mp4.
  Otherwise the file is an MKV, remux that as is into MP4. Unsupported audio streams are removed in the process.
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
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const extension = getContainer(args.inputFileObj._id);
  let outputFileId = '';
  let inputArguments : string[] = [];
  const outputArguments = [
    '-dn',
    '-movflags', '+faststart',
    '-strict', 'unofficial',
  ];

  // Only remux the file as it is
  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (
      stream.codec_type !== 'video'
      && (
        stream.codec_type !== 'audio'
        // Remove truehd and dca audio streams as they are not well supported by ffmpeg in mp4
        || (stream.codec_type === 'audio' && ['dca', 'truehd'].includes(stream.codec_name))
      )
    ) {
      stream.removed = true;
    }
  });
  outputArguments.unshift(...[
    '-map_metadata', '0',
    '-map_metadata:c', '-1',
    '-bsf:v', 'hevc_mp4toannexb',
  ]);
  outputFileId = args.inputFileObj._id;


  // The 'title' tag in the stream metadata is not recognized in mp4 containers
  // as a workaround setting the title in the 'handler_name' tag works
  if (args.originalLibraryFile.ffProbeData.streams) {
    let offset = 0;
    args.originalLibraryFile.ffProbeData.streams.forEach((stream, index) => {
      if (stream.codec_type === 'audio' && stream.tags && stream.tags.title) {
        if (stream.codec_type === 'audio' && ['dca', 'truehd'].includes(stream.codec_name)) {
          offset += 1;
        } else {
          outputArguments.push(`-metadata:s:${index - offset}`);
          outputArguments.push(`handler_name=${stream.tags.title}`);
        }
      }
    });
  }

  args.variables.ffmpegCommand.overallInputArguments.push(...inputArguments);
  args.variables.ffmpegCommand.overallOuputArguments.push(...outputArguments);

  return {
    outputFileObj: {
      _id: outputFileId,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
