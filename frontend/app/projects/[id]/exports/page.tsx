'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ExportWizard } from '@/components/exports/ExportWizard';
import { ExportList } from '@/components/exports/ExportList';
import { ExportSummary } from '@/components/exports/ExportSummary';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  DocumentArrowDownIcon, 
  PlusIcon, 
  DocumentTextIcon,
  TableCellsIcon,
  CodeBracketIcon,
  FilmIcon
} from '@heroicons/react/24/outline';

interface Export {
  id: string;
  projectId: number;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileSize: number;
  createdAt: string;
  downloadUrl?: string;
  metadata?: any;
}

interface ProjectSummary {
  projectId: number;
  projectTitle: string;
  sceneCount: number;
  shotCount: number;
  frameCount: number;
  totalDuration: number;
  exportFormats: string[];
  createdAt: string;
}

export default function ExportsPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string);
  
  const [exports, setExports] = useState<Export[]>([]);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExports();
    fetchSummary();
  }, [projectId]);

  const fetchExports = async () => {
    try {
      const response = await fetch(`/api/v1/exports?projectId=${projectId}`);
      const data = await response.json();
      setExports(data.exports || []);
    } catch (error) {
      console.error('Failed to fetch exports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`/api/v1/exports/project/${projectId}/summary`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleGenerateExport = async (exportData: any) => {
    try {
      const response = await fetch('/api/v1/exports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setShowWizard(false);
        // Start polling for status
        pollExportStatus(result.export_id);
      } else {
        throw new Error(result.message || 'Failed to generate export');
      }
    } catch (error) {
      console.error('Failed to generate export:', error);
    }
  };

  const pollExportStatus = async (exportId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/v1/exports/${exportId}/status`);
        const status = await response.json();
        
        if (status.status === 'completed') {
          fetchExports(); // Refresh list
          return;
        } else if (status.status === 'failed') {
          console.error('Export generation failed:', status.message);
          return;
        }
        
        // Continue polling
        setTimeout(poll, 2000);
      } catch (error) {
        console.error('Failed to poll export status:', error);
      }
    };
    
    poll();
  };

  const handleDeleteExport = async (exportId: string) => {
    if (!confirm('Are you sure you want to delete this export?')) return;
    
    try {
      const response = await fetch(`/api/v1/exports/${exportId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchExports();
      } else {
        throw new Error('Failed to delete export');
      }
    } catch (error) {
      console.error('Failed to delete export:', error);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <DocumentTextIcon className="h-5 w-5" />;
      case 'csv': return <TableCellsIcon className="h-5 w-5" />;
      case 'json': return <CodeBracketIcon className="h-5 w-5" />;
      case 'mp4': return <FilmIcon className="h-5 w-5" />;
      default: return <DocumentArrowDownIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'processing': return 'blue';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Exports</h1>
          <p className="text-gray-600 mt-2">Generate and manage exports for this project</p>
        </div>
        <Button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Generate Export
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Project Summary */}
        <div className="lg:col-span-1">
          {summary && <ExportSummary summary={summary} />}
        </div>

        {/* Exports List */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <DocumentArrowDownIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Exports</h2>
            </div>
            
            {exports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DocumentArrowDownIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No exports generated yet</p>
                <p className="mb-6">Generate your first export to get started</p>
                <Button
                  onClick={() => setShowWizard(true)}
                  variant="outline"
                  className="flex items-center gap-2 mx-auto"
                >
                  <PlusIcon className="h-4 w-4" />
                  Generate First Export
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {exports.map((exportItem) => (
                  <div
                    key={exportItem.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-gray-600">
                          {getFormatIcon(exportItem.format)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {exportItem.format.toUpperCase()} Export
                          </h3>
                          <p className="text-sm text-gray-600">
                            Created {new Date(exportItem.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge color={getStatusColor(exportItem.status)}>
                        {exportItem.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <p>Format: {exportItem.format.toUpperCase()}</p>
                      <p>File Size: {formatFileSize(exportItem.fileSize)}</p>
                      {exportItem.metadata && (
                        <div>
                          {exportItem.metadata.page_count && (
                            <p>Pages: {exportItem.metadata.page_count}</p>
                          )}
                          {exportItem.metadata.duration && (
                            <p>Duration: {exportItem.metadata.duration}s</p>
                          )}
                          {exportItem.metadata.row_count && (
                            <p>Rows: {exportItem.metadata.row_count}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {exportItem.status === 'processing' && (
                      <div className="mb-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${exportItem.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{exportItem.progress}% complete</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {exportItem.status === 'completed' && exportItem.downloadUrl && (
                        <Button
                          onClick={() => window.open(exportItem.downloadUrl, '_blank')}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                          Download
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteExport(exportItem.id)}
                        size="sm"
                        variant="outline"
                        color="red"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Export Wizard Modal */}
      {showWizard && (
        <ExportWizard
          projectId={projectId}
          onGenerate={handleGenerateExport}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
