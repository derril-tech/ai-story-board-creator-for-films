'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, DocumentArrowDownIcon, DocumentTextIcon, TableCellsIcon, CodeBracketIcon, FilmIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';

interface ExportWizardProps {
  projectId: number;
  onGenerate: (data: any) => void;
  onClose: () => void;
}

interface Format {
  id: string;
  name: string;
  description: string;
  layouts?: string[];
}

interface QualityPreset {
  id: string;
  name: string;
  description: string;
}

export function ExportWizard({ projectId, onGenerate, onClose }: ExportWizardProps) {
  const [formats, setFormats] = useState<Format[]>([]);
  const [qualityPresets, setQualityPresets] = useState<QualityPreset[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    format: 'pdf',
    includeFrames: true,
    includeMetadata: true,
    layout: 'storyboard',
    quality: 'high',
    customOptions: {},
  });

  useEffect(() => {
    fetchFormats();
    fetchQualityPresets();
  }, []);

  const fetchFormats = async () => {
    try {
      const response = await fetch('/api/v1/exports/formats');
      const data = await response.json();
      setFormats(data.formats || []);
    } catch (error) {
      console.error('Failed to fetch formats:', error);
    }
  };

  const fetchQualityPresets = async () => {
    try {
      const response = await fetch('/api/v1/exports/quality-presets');
      const data = await response.json();
      setQualityPresets(data.presets || []);
    } catch (error) {
      console.error('Failed to fetch quality presets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onGenerate({
        projectId,
        ...formData,
      });
    } catch (error) {
      console.error('Failed to generate export:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getFormatIcon = (formatId: string) => {
    switch (formatId) {
      case 'pdf': return <DocumentTextIcon className="h-6 w-6" />;
      case 'csv': return <TableCellsIcon className="h-6 w-6" />;
      case 'json': return <CodeBracketIcon className="h-6 w-6" />;
      case 'mp4': return <FilmIcon className="h-6 w-6" />;
      default: return <DocumentArrowDownIcon className="h-6 w-6" />;
    }
  };

  const selectedFormat = formats.find(f => f.id === formData.format);

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <DocumentArrowDownIcon className="h-6 w-6 text-blue-600" />
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Export Wizard
              </Dialog.Title>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Format Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Choose Export Format</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formats.map((format) => (
                  <div
                    key={format.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.format === format.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('format', format.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`${
                        formData.format === format.id ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {getFormatIcon(format.id)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{format.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                        {format.layouts && format.layouts.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Layouts: {format.layouts.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Format-specific options */}
            {selectedFormat && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Format Options</h3>
                
                {/* PDF Layout */}
                {formData.format === 'pdf' && selectedFormat.layouts && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PDF Layout
                    </label>
                    <Select
                      value={formData.layout}
                      onChange={(value) => handleInputChange('layout', value)}
                    >
                      {selectedFormat.layouts.map((layout) => (
                        <option key={layout} value={layout}>
                          {layout.charAt(0).toUpperCase() + layout.slice(1).replace('_', ' ')}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                {/* Quality Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality
                  </label>
                  <Select
                    value={formData.quality}
                    onChange={(value) => handleInputChange('quality', value)}
                  >
                    {qualityPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </Select>
                  {qualityPresets.find(p => p.id === formData.quality) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {qualityPresets.find(p => p.id === formData.quality)?.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Content Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Content Options</h3>
              
              <div className="space-y-3">
                <Checkbox
                  checked={formData.includeFrames}
                  onChange={(checked) => handleInputChange('includeFrames', checked)}
                  label="Include frame images"
                />
                
                <Checkbox
                  checked={formData.includeMetadata}
                  onChange={(checked) => handleInputChange('includeMetadata', checked)}
                  label="Include shot/dialogue metadata"
                />
              </div>
            </div>

            {/* Export Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Export Preview</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Format:</strong> {selectedFormat?.name || formData.format.toUpperCase()}</p>
                <p><strong>Quality:</strong> {qualityPresets.find(p => p.id === formData.quality)?.name || formData.quality}</p>
                {formData.format === 'pdf' && (
                  <p><strong>Layout:</strong> {formData.layout.charAt(0).toUpperCase() + formData.layout.slice(1).replace('_', ' ')}</p>
                )}
                <p><strong>Include Frames:</strong> {formData.includeFrames ? 'Yes' : 'No'}</p>
                <p><strong>Include Metadata:</strong> {formData.includeMetadata ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    Generate Export
                  </>
                )}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
