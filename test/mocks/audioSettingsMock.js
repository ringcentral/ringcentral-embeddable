/**
 * Stub for `micro-phone`'s AudioSettings.
 *
 * The real module imports Juno's ESM build, which jest does not transform. Only
 * the class identity is needed here: modules under test take AudioSettings as a
 * constructor dependency and tests supply their own plain object instead.
 */
class AudioSettings {}

module.exports = { AudioSettings, default: AudioSettings };
