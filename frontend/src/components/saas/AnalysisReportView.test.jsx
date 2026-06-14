import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalysisReportView } from './AnalysisReportView';

const SAMPLE_RESPONSE = {
  assetid: '1001',
  assetname: 'HP Printer',
  description: 'HP Black and White Printer',
  tagnumber: '100000078',
  imageAnalysis:
    'HP Color LaserJet Pro multifunction printer. Features a white body with dark gray accents.',
  detectedAsset: 'HP Color LaserJet Pro printer',
  imageReadability: 'Y',
  namedescriptionmatch: 'Y',
  namedescriptionmatchpercent: 100,
  reasoning:
    'User Claim: HP Printer (Physical Asset). Image Shows: HP Color LaserJet Pro multifunction printer.',
  subcatmodelmatch: 'N',
  subcatmodelmatchpercent: 20,
  recommendedsubcategory: 'Multifunction Printer',
  recommendedmakemodel: 'HP Color LaserJet Pro',
  detectedtagnumber: '10000078',
  detectedtagnumbermatch: 'N',
  detectedtagnumbermatchpercent: 0,
  barcodeposition: {
    position: 'On the front-left side panel of the printer.',
  },
  damage_assessment: 'Excellent condition with no signs of use or wear.',
  condition: 'Excellent condition, appears new and clean with no visible damage.',
  costvalidation: {
    estimatedcost: 35000.0,
    usercost: 36000.0,
    costmatch: 'Y',
    reasoning: 'User cost INR 36000 is reasonable for this HP Color LaserJet Pro printer.',
  },
  acquisitiondatevalidation: {
    estimatedyear: 2022,
    estimatedmarketstatus: 'AVAILABLE',
    useracquisitiondate: '01-01-2023',
    datematch: 'Y',
    reasoning: 'Acquisition year 2023 is valid.',
  },
};

describe('AnalysisReportView', () => {
  it('renders executive report sections from AI response', () => {
    render(
      <AnalysisReportView
        analysis={{ response_json: SAMPLE_RESPONSE, ai_status: 'fail' }}
        asset={{
          assetid: 'AST-10001',
          assetname: 'HP Printer',
          company: 'Flipkart Pvt Ltd',
          subcategoryname: 'Laptop',
          makemodelname: 'HP Laptop',
          tagnumber: '100000078',
          cost: 36000,
          acquisitiondate: '01-01-2023',
        }}
        aiStatus="fail"
      />,
    );

    expect(screen.getByText('AI Validation Report')).toBeInTheDocument();
    expect(screen.getAllByText('HP Color LaserJet Pro printer').length).toBeGreaterThan(0);
    expect(screen.getByText('Visual inspection')).toBeInTheDocument();
    expect(screen.getByText('Classification')).toBeInTheDocument();
    expect(screen.getByText('Multifunction Printer')).toBeInTheDocument();
    expect(screen.getByText(/User cost INR 36000 is reasonable/)).toBeInTheDocument();
    expect(screen.getByText(/Acquisition year 2023 is valid/)).toBeInTheDocument();
  });
});
