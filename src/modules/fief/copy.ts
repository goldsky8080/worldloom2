import { useTranslation } from '../../services/localization';
const rows = `title|새벽물결 영지|Dawnwater Fief|暁の領地|晨水领地|Lãnh địa Bình Minh
subtitle|인스턴스 영지 · 경영 프로토타입|INSTANCE FIEF · MANAGEMENT PROTOTYPE|インスタンス領地 · 管理試作|实例领地 · 管理原型|LÃNH ĐỊA RIÊNG · NGUYÊN MẪU
prototype|테스트용 영지 1개 · 귀족 권한 가정|One test fief · assumed noble access|試験領地1つ · 貴族権限を仮定|一个测试领地 · 假定贵族权限|Một lãnh địa thử · giả định quý tộc
atlas|월드 아틀라스|World atlas|ワールドアトラス|世界图集|Atlas thế giới
game|플레이 지도로|Play map|プレイマップ|游戏地图|Bản đồ chơi
language|언어|Language|言語|语言|Ngôn ngữ
castle|성|Castle|城|城堡|Thành
city|도시|City|都市|城市|Đô thị
manor|장원|Manor|荘園|庄园|Trang viên
dungeon|영지 던전|Fief dungeon|領地ダンジョン|领地地下城|Hầm ngục lãnh địa
palace|고대 지하궁전|Ancient Underground Palace|古代地下宮殿|古代地下宫殿|Cung điện ngầm cổ
kingdom|에르덴 왕국|Kingdom of Erden|エルデン王国|埃尔登王国|Vương quốc Erden
lord|테스트 영주 · 기사|Test lord · Knight|試験領主 · 騎士|测试领主 · 骑士|Lãnh chúa thử · Hiệp sĩ
instance|개인 관리 공간|Private management space|個人の管理空間|私人管理空间|Không gian quản lý riêng
permanent|영구 던전 · 위치와 정체성 유지|Permanent dungeon · same location and identity|恒久ダンジョン · 位置と個性を維持|永久地下城 · 位置与身份不变|Hầm ngục vĩnh viễn · giữ vị trí và danh tính
cycle|던전 주기|Dungeon cycle|ダンジョン周期|地下城周期|Chu kỳ hầm ngục
current|현재 등급|Current grade|現在の等級|当前等级|Hạng hiện tại
next|다음 주기|Next cycle|次の周期|下个周期|Chu kỳ sau
range|다음 주기 허용 범위|Next cycle grade range|次周期の等級範囲|下个周期等级范围|Phạm vi hạng chu kỳ sau
analysis|에테르 변동 분석 중|Analyzing aether distortion|エーテル変動を分析中|正在分析以太变动|Đang phân tích biến động aether
confirmed|다음 등급 예고|Next grade forecast|次の等級予告|下个等级预告|Dự báo hạng kế tiếp
levelNote|도시 변경은 다음 주기부터 반영됩니다. 현재 등급은 유지됩니다.|City changes apply next cycle. The current grade stays.|都市の変更は次周期に反映。現在の等級は維持。|城市变更下个周期生效，当前等级保持。|Đổi đô thị áp dụng chu kỳ sau. Giữ hạng hiện tại.
aether|던전 에테르|Dungeon aether|ダンジョンのエーテル|地下城以太|Aether hầm ngục
stable|안정|Stable|安定|稳定|Ổn định
unstable|불안정|Unstable|不安定|不稳定|Bất ổn
danger|위험|Danger|危険|危险|Nguy hiểm
critical|폭주 임박|Critical|暴走寸前|即将暴走|Nguy cấp
break|던전 폭주|Dungeon break|ダンジョン暴走|地下城暴走|Bùng phát hầm ngục
warning|몬스터 웨이브 경보 · 영지 위험 상태|Monster wave alert · fief at risk|モンスター波の警報 · 領地危険|怪物浪潮警报 · 领地危险|Cảnh báo làn sóng quái · lãnh địa nguy hiểm
warningNote|공략으로 에테르를 낮추세요. 이 단계에서는 시설 파괴나 실제 전투가 없습니다.|Raid to reduce aether. Facility damage and combat are deferred.|攻略でエーテル低下。施設破壊や戦闘は後続段階。|通过攻略降低以太，设施破坏和战斗留待后续。|Đột kích để giảm aether. Hư hại và chiến đấu ở giai đoạn sau.
raid|테스트 던전 공략|Test dungeon raid|試験ダンジョン攻略|测试地下城攻略|Đột kích thử
raidNote|모의 공략 · 에테르 −35 · 재화·전리품 없음|Simulated raid · aether −35 · no currency or loot|模擬攻略 · エーテル −35 · 報酬なし|模拟攻略 · 以太 −35 · 无货币或战利品|Đột kích mô phỏng · aether −35 · không có chiến lợi phẩm
testControls|개발용 시간 조작|Developer time controls|開発用時間操作|开发时间控制|Điều khiển thời gian thử
accelerated|가속 테스트 · 주기 2분|Accelerated test · 2 min cycle|加速試験 · 2分周期|加速测试 · 2分钟周期|Thử nhanh · chu kỳ 2 phút
design|설계 시간 · 주기 21일|Design time · 21 day cycle|設計時間 · 21日周期|设计时间 · 21天周期|Thời gian thiết kế · 21 ngày
pause|시간 일시정지|Pause clock|時間停止|暂停时间|Dừng thời gian
resume|시간 재개|Resume clock|時間再開|继续时间|Tiếp tục thời gian
advance|시간 +30초|Advance 30 seconds|30秒進める|时间 +30秒|Tiến 30 giây
force|다음 주기 실행|Start next cycle|次周期を実行|执行下个周期|Bắt đầu chu kỳ sau
reset|영지 초기화|Reset fief|領地初期化|重置领地|Đặt lại lãnh địa
rules|임시 테스트 규칙|Provisional test rules|暫定試験ルール|临时测试规则|Quy tắc thử tạm thời
rulesNote|등급은 허용 범위의 고정 시퀀스입니다. 에테르 속도·공략량·상태 경계·예고 시점은 테스트용이며 운영 밸런스가 아닙니다.|Grades follow a fixed sequence within the allowed range. Aether rate, raid reduction, thresholds and reveal timing are test values.|等級は範囲内の固定順序。速度・減少量・閾値・予告時点は試験用。|等级在允许范围内按固定序列变化。以太速率、攻略减量、阈值和预告时间均为测试值。|Hạng theo trình tự cố định trong phạm vi. Tốc độ, giảm lượng, ngưỡng và dự báo là giá trị thử.
sessionNote|화면을 떠나거나 새로고침하면 초기화됩니다. 숨겨진 탭에서는 시간이 멈춥니다.|Leaving or reloading resets the prototype. Hidden tabs pause time.|画面退出・更新で初期化。非表示タブは時間停止。|离开或刷新后重置。隐藏标签页时暂停时间。|Rời trang hoặc tải lại sẽ đặt lại. Tab ẩn dừng thời gian.
cityLevel|도시 레벨 · 테스트|City level · test|都市レベル · 試験|城市等级 · 测试|Cấp đô thị · thử
castleLevel|성 레벨 · 테스트|Castle level · test|城レベル · 試験|城堡等级 · 测试|Cấp thành · thử
cityRole|주민·생산·교역의 중심. 다음 던전 등급 범위를 결정합니다.|Population, production and trade. Determines the next dungeon grade range.|住民・生産・交易の中心。次の等級範囲を決定。|居民、生产和贸易中心。决定下个地下城等级范围。|Dân cư, sản xuất và giao thương. Xác định phạm vi hạng.
castleRole|주둔군·순찰·치안·웨이브 방어. 던전 등급 추첨에는 관여하지 않습니다.|Garrison, patrol, security and wave defense. Does not select dungeon grades.|駐屯・巡回・治安・防衛。等級抽選には影響なし。|驻军、巡逻、治安和浪潮防御。不参与地下城等级选择。|Đồn trú, tuần tra, an ninh và phòng thủ. Không chọn hạng hầm ngục.
manorRole|영지 상태 확인과 관리 거점. 창고·정책·관리관은 후속 단계입니다.|Management hub. Storage, policies and stewards are deferred.|領地管理拠点。倉庫・政策・管理官は後続段階。|领地管理中心。仓库、政策和管理官留待后续。|Trung tâm quản lý. Kho, chính sách và quản gia ở giai đoạn sau.
readiness|성 관리 여력 · 임시 비교|Castle capacity · provisional comparison|城の管理余力 · 仮比較|城堡管理能力 · 临时比较|Năng lực thành · so sánh tạm
ready|관리 여력 있음|Capacity available|管理余力あり|管理能力充足|Còn năng lực
strained|관리 부담 증가|Management strain|管理負担増加|管理负担增加|Áp lực quản lý
insufficient|방어 여력 부족|Insufficient capacity|防衛余力不足|防御能力不足|Thiếu năng lực
patrolNote|성 순찰은 외부 몬스터 억제 역할입니다. 던전 내부 에테르는 공략으로 낮춥니다.|Patrols suppress external monsters. Raids reduce internal aether.|巡回は外部の敵を抑制。内部エーテルは攻略で低下。|巡逻压制外部怪物。攻略降低内部以太。|Tuần tra ngăn quái bên ngoài. Đột kích giảm aether bên trong.
monsters|몬스터 구성|Monsters|モンスター構成|怪物组成|Quái vật
boss|보스|Boss|ボス|首领|Trùm
resource|자원 구성|Resources|資源構成|资源组成|Tài nguyên
goblin|고블린|Goblins|ゴブリン|哥布林|Goblin
orc|오크|Orcs|オーク|兽人|Orc
troll|트롤|Troll|トロル|巨魔|Troll
undead|언데드|Undead|アンデッド|亡灵|Xác sống
scout|고블린 정찰대장|Goblin Scout Captain|ゴブリン偵察長|哥布林侦察队长|Đội trưởng Goblin
chieftain|부족 족장|Tribal Chieftain|部族長|部落首领|Tộc trưởng
warden|심층 감시자|Deep Warden|深層の番人|深层守望者|Hộ vệ sâu
lich|고대 리치|Ancient Lich|古代リッチ|古代巫妖|Lich cổ
ancientKing|지하궁전의 왕|King of the Palace|地下宮殿の王|地下宫殿之王|Vua cung điện
copper|구리 광맥|Copper veins|銅鉱脈|铜矿脉|Mạch đồng
iron|철 광맥|Iron veins|鉄鉱脈|铁矿脉|Mạch sắt
crystal|마력 수정|Mana crystals|魔力結晶|魔力水晶|Tinh thể ma lực
aetherOre|에테르 원석|Aether ore|エーテル原石|以太原石|Quặng aether
history|영지 관리 기록|Management log|領地管理記録|领地管理记录|Nhật ký quản lý
empty|아직 기록이 없습니다. 시간을 진행하거나 던전을 공략해 보세요.|No events yet. Advance time or raid the dungeon.|記録なし。時間を進めるか攻略してください。|暂无记录。推进时间或攻略地下城。|Chưa có sự kiện. Tiến thời gian hoặc đột kích.
cycleEvent|주기 갱신|Cycle renewed|周期更新|周期更新|Đổi chu kỳ
raidEvent|공략 완료|Raid completed|攻略完了|攻略完成|Đột kích xong
breakEvent|폭주 발생|Break triggered|暴走発生|暴走发生|Bùng phát
breakCount|누적 폭주|Breaks recorded|累計暴走|累计暴走|Lần bùng phát
raidCount|공략 횟수|Raids completed|攻略回数|攻略次数|Lần đột kích
map|인스턴스 영지 지도|Instance fief map|インスタンス領地地図|实例领地地图|Bản đồ lãnh địa riêng
mapHint|시설을 선택하여 역할을 확인하세요.|Select a facility to inspect its role.|施設を選んで役割を確認。|选择设施查看用途。|Chọn công trình để xem vai trò.
noEconomy|경제·세금·보상은 아직 계산하지 않습니다.|Economy, tax and rewards are not simulated yet.|経済・税・報酬は未計算。|尚未模拟经济、税收和奖励。|Chưa mô phỏng kinh tế, thuế và thưởng.`;
const entries = Object.fromEntries(
  rows.split('\n').map((row) => {
    const [key, ...values] = row.split('|');
    return [key, values];
  }),
);
export function useFiefCopy() {
  const { language } = useTranslation();
  const index = ({ ko: 0, en: 1, ja: 2, 'zh-CN': 3, vi: 4 } as const)[language];
  return { language, t: (key: string) => entries[key]?.[index] ?? entries[key]?.[1] ?? key };
}
