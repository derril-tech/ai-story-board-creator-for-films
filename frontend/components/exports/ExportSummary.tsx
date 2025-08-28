'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  DocumentTextIcon, 
  FilmIcon, 
  ClockIcon, 
  DocumentArrowDownIcon 
} from '@heroicons/react/24/outline';

interface ExportSummaryProps {
  summary: {
    projectId: number;
    projectTitle: string;
    sceneCount: number;
    shotCount: number;
    frameCount: number;
    totalDuration: number;
    exportFormats: string[];
    createdAt: string;
  };
}

export function ExportSummary({ summary }: ExportSummaryProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <DocumentArrowDownIcon className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Project Summary</h2>
      </div>

      <div className="space-y-4">
        {/* Project Info */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2">{summary.projectTitle}</h3>
          <p className="text-sm text-gray-600">Created {formatDate(summary.createdAt)}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DocumentTextIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Scenes</span>
            </div>
            <p className="text-lg font-bold text-blue-900">{summary.sceneCount}</p>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FilmIcon className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Shots</span>
            </div>
            <p className="text-lg font-bold text-green-900">{summary.shotCount}</p>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FilmIcon className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Frames</span>
            </div>
            <p className="text-lg font-bold text-purple-900">{summary.frameCount}</p>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ClockIcon className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Duration</span>
            </div>
            <p className="text-lg font-bold text-orange-900">{formatTime(summary.totalDuration)}</p>
          </div>
        </div>

        {/* Export Formats */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Available Export Formats</h4>
          <div className="flex flex-wrap gap-1">
            {summary.exportFormats.map((format) => (
              <Badge key={format} color="blue" size="sm">
                {format.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h4>
          <div className="space-y-2">
            <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors">
              Generate PDF Storyboard
            </button>
            <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors">
              Export Shot List (CSV)
            </button>
            <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors">
              Download Project Data (JSON)
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
