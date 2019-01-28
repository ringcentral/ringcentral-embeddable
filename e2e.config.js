module.exports = {
  selectorLabel: 'data-sign',
  params: {
    projects: {
      'RingCentral Embeddable': {
        type: 'uri',
        location: 'http://localhost:8080/',
      }
    }
  },
  lookupConfig({
    config,
    tag
  }) {
    return config.params.projects[tag.project];
  },
};
