'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { DropZone } from '@/components/DropZone';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ImageGalleryPdf } from '@/components/ImageGalleryPdf';
import { FileQueue } from '@/components/FileQueue';
import { ResultSummary } from '@/components/ResultSummary';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <Header />
      
      <div className="space-y-5">
        <DropZone />
        <SettingsPanel />
        <ImageGalleryPdf />
        <ResultSummary />
        <FileQueue />
      </div>

      <Footer />
    </div>
  );
}
