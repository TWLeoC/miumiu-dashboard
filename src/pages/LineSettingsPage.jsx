import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LineSettingsPage() {
  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">LINE 通知設定</h1>
      <Card>
        <CardHeader><CardTitle>LINE Channel 設定</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-2">
            設定商家自己的 LINE Channel Access Token 與 Secret。<br />
            若未設定，將使用平台預設。
          </p>
          <p className="text-sm text-gray-400">開發中...</p>
        </CardContent>
      </Card>
    </div>
  )
}
