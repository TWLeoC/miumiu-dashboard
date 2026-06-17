import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminLogsPage() {
  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">操作紀錄</h1>
      <Card>
        <CardHeader><CardTitle>管理員操作紀錄</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">開發中...</p>
        </CardContent>
      </Card>
    </div>
  )
}
