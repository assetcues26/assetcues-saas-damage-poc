export const CHECK_LABELS = {
  imageReadability: 'Image readability',
  namedescriptionmatch: 'Name & description match',
  subcatmodelmatch: 'Subcategory & make/model',
  detectedtagnumbermatch: 'Tag number match',
  costmatch: 'Cost validation',
  datematch: 'Acquisition date validation',
};

export const PERCENT_KEYS = {
  namedescriptionmatch: 'namedescriptionmatchpercent',
  subcatmodelmatch: 'subcatmodelmatchpercent',
  detectedtagnumbermatch: 'detectedtagnumbermatchpercent',
  costmatch: 'costmatchpercent',
  datematch: 'datematchpercent',
};

export const FIELD_PATCH_MAP = {
  namedescriptionmatch: ['assetname', 'description'],
  subcatmodelmatch: ['subcategoryname', 'makemodelname', 'makemodelid'],
  detectedtagnumbermatch: ['tagnumber'],
  costmatch: ['cost'],
  datematch: ['acquisitiondate'],
};
