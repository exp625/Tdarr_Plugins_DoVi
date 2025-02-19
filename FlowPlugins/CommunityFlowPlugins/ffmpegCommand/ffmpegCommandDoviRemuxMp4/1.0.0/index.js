"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
/* eslint-disable no-param-reassign */
var details = function () { return ({
    name: 'DoVi Remux MP4',
    description: "\n  If input is MP4, then the video stream from that with other streams from original file into mp4.\n  Otherwise the file is an MKV, remux that as is into MP4. Unsupported audio streams are removed in the process.\n  ",
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
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var _a, _b;
    var extension = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
    var outputFileId = '';
    var inputArguments = [];
    var outputArguments = [
        '-dn',
        '-movflags', '+faststart',
        '-strict', 'unofficial',
    ];
    // Only remux the file as it is
    args.variables.ffmpegCommand.streams.forEach(function (stream) {
        if (stream.codec_type !== 'video'
            && (stream.codec_type !== 'audio'
                // Remove truehd and dca audio streams as they are not well supported by ffmpeg in mp4
                || (stream.codec_type === 'audio' && ['dca', 'truehd'].includes(stream.codec_name)))) {
            stream.removed = true;
        }
    });
    outputArguments.unshift.apply(outputArguments, [
        '-map_metadata', '0',
        '-map_metadata:c', '-1',
        '-bsf:v', 'hevc_mp4toannexb',
    ]);
    outputFileId = args.inputFileObj._id;
    // The 'title' tag in the stream metadata is not recognized in mp4 containers
    // as a workaround setting the title in the 'handler_name' tag works
    if (args.originalLibraryFile.ffProbeData.streams) {
        var offset_1 = 0;
        args.originalLibraryFile.ffProbeData.streams.forEach(function (stream, index) {
            if (stream.codec_type === 'audio' && stream.tags && stream.tags.title) {
                if (stream.codec_type === 'audio' && ['dca', 'truehd'].includes(stream.codec_name)) {
                    offset_1 += 1;
                }
                else {
                    outputArguments.push("-metadata:s:".concat(index - offset_1));
                    outputArguments.push("handler_name=".concat(stream.tags.title));
                }
            }
        });
    }
    (_a = args.variables.ffmpegCommand.overallInputArguments).push.apply(_a, inputArguments);
    (_b = args.variables.ffmpegCommand.overallOuputArguments).push.apply(_b, outputArguments);
    return {
        outputFileObj: {
            _id: outputFileId,
        },
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
