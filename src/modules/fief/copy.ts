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
const gameplayRows = `readiness|성 관리 여력|Castle capacity|城の管理余力|城堡管理能力|Năng lực thành
lord|영주 · 기사|Lord · Knight|領主 · 騎士|领主 · 骑士|Lãnh chúa · Hiệp sĩ
treasury|영지 금고|Treasury|領地金庫|领地金库|Ngân khố
sentiment|민심|Public sentiment|民心|民心|Lòng dân
security|치안|Security|治安|治安|An ninh
prosperity|번영|Prosperity|繁栄|繁荣|Thịnh vượng
saturation|몬스터 포화도|Monster saturation|モンスター圧力|怪物压力|Áp lực quái vật
saturationStable|외곽 안정|Perimeter stable|外縁安定|外围稳定|Vùng ngoài ổn định
saturationRising|몬스터 활동 증가|Monster activity rising|活動増加|怪物活动增加|Quái vật tăng hoạt động
saturationDanger|외곽 위험|Perimeter danger|外縁危険|外围危险|Vùng ngoài nguy hiểm
saturationCritical|외곽 매우 위험|Perimeter critical|外縁非常に危険|外围极度危险|Vùng ngoài nguy cấp
garrison|주둔군|Garrison|駐屯軍|驻军|Đồn trú
recruit|병사 모집|Recruit soldiers|兵士募集|招募士兵|Tuyển quân
patrol|던전 주변 순찰|Patrol dungeon perimeter|ダンジョン外縁巡回|巡逻地下城外围|Tuần tra quanh hầm ngục
patrolReady|순찰 대기|Patrol ready|巡回待機|巡逻待命|Tuần tra sẵn sàng
patrolMoving|순찰대 이동 중|Patrol travelling|巡回隊移動中|巡逻队移动中|Đội tuần tra di chuyển
patrolDone|외곽 순찰 완료|Patrol completed|外縁巡回完了|外围巡逻完成|Tuần tra hoàn tất
patrolShort|순찰은 외부 몬스터를 억제합니다.|Patrols suppress external monsters.|巡回は外部の敵を抑制。|巡逻压制外部怪物。|Tuần tra ngăn quái bên ngoài.
raidAction|직접 공략|Raid dungeon|直接攻略|直接攻略|Đột kích hầm ngục
raidReady|공략 준비 가능|Ready to raid|攻略準備可能|可准备攻略|Sẵn sàng đột kích
raidPreparing|공략 준비 중|Preparing raid|攻略準備中|准备攻略中|Chuẩn bị đột kích
raidProgress|던전 공략 중|Raiding dungeon|ダンジョン攻略中|攻略地下城中|Đang đột kích
raidDone|공략 완료 · 에테르 안정화|Raid completed · aether reduced|攻略完了 · エーテル安定化|攻略完成 · 以太稳定化|Đột kích xong · giảm aether
contractAction|토벌 의뢰 등록|Post dungeon contract|討伐依頼を登録|发布讨伐委托|Đăng hợp đồng đột kích
contractNone|등록된 의뢰 없음|No active contract|依頼なし|暂无委托|Chưa có hợp đồng
contractPosted|모험가 파티 모집 중|Seeking adventurer party|冒険者パーティー募集中|招募冒险者队伍中|Tìm nhóm mạo hiểm
contractAccepted|은빛등불 파티가 수락했습니다|Silver Lantern party accepted|銀灯のパーティーが受諾|银灯队伍已接受|Nhóm Đèn Bạc đã nhận
contractProgress|은빛등불 파티 공략 중|Silver Lantern party raiding|銀灯のパーティーが攻略中|银灯队伍正在攻略|Nhóm Đèn Bạc đang đột kích
contractDone|의뢰 완료 · 던전 안정화|Contract completed · dungeon stabilized|依頼完了 · 安定化|委托完成 · 地下城稳定化|Hợp đồng xong · hầm ngục ổn định
contractGoal|목표: 던전 에테르 안정화|Goal: stabilize dungeon aether|目標: エーテル安定化|目标：稳定地下城以太|Mục tiêu: ổn định aether
simulatedParty|가상 모험가 파티|Simulated adventurer party|模擬冒険者パーティー|模拟冒险者队伍|Nhóm mạo hiểm mô phỏng
insufficientGold|금고 잔액이 부족합니다.|Insufficient treasury funds.|金庫残高不足。|金库余额不足。|Ngân khố không đủ.
garrisonFull|주둔군 수용 한도에 도달했습니다.|Garrison capacity reached.|駐屯軍定員に到達。|驻军达到容量上限。|Đồn trú đã đầy.
needSoldiers|순찰 병력이 부족합니다.|Not enough soldiers for patrol.|巡回兵力不足。|巡逻兵力不足。|Không đủ quân tuần tra.
wave|몬스터 웨이브|Monster wave|モンスターウェーブ|怪物浪潮|Làn sóng quái vật
waveApproaching|몬스터가 도시로 향합니다|Monsters approaching the city|モンスターが都市へ接近|怪物正在接近城市|Quái vật tiến đến đô thị
cityDamaged|도시 피해 발생|City damaged|都市に被害|城市受损|Đô thị bị thiệt hại
cityCalm|도시 안정|City stable|都市安定|城市稳定|Đô thị ổn định
calm|영지 평온|Fief at peace|領地平穏|领地平静|Lãnh địa yên bình
aetherWarning|던전 내부 위험 상승|Dungeon aether danger|内部危険増加|地下城内部危险增加|Nguy cơ aether tăng
saturationWarning|던전 외곽 몬스터 위험|Monsters threaten the perimeter|外縁モンスター危険|地下城外围怪物危险|Quái đe dọa vùng ngoài
securityWarning|치안 회복 필요|Security needs attention|治安改善が必要|需要改善治安|An ninh cần cải thiện
warnings|현재 경고|Active warnings|現在の警告|当前警报|Cảnh báo hiện tại
cityStatus|도시 상태|City condition|都市の状態|城市状态|Tình trạng đô thị
report|영지 보고|Fief report|領地報告|领地报告|Báo cáo lãnh địa
waveDamageEvent|웨이브 도착 · 도시 피해|Wave arrived · city damaged|ウェーブ到着 · 都市被害|浪潮抵达 · 城市受损|Làn sóng đến · đô thị thiệt hại
recruitEvent|병사 모집 완료|Soldiers recruited|兵士募集完了|招募士兵完成|Đã tuyển quân
patrolStartedEvent|외곽 순찰 출발|Perimeter patrol departed|外縁巡回出発|外围巡逻出发|Tuần tra khởi hành
patrolCompleteEvent|외곽 몬스터 억제 완료|Perimeter monsters suppressed|外縁の敵を抑制|外围怪物已压制|Đã ngăn quái vùng ngoài
raidStartedEvent|던전 공략 출발|Dungeon raid started|ダンジョン攻略開始|开始攻略地下城|Đột kích bắt đầu
contractPostedEvent|토벌 의뢰 등록|Contract posted|討伐依頼登録|讨伐委托已发布|Đã đăng hợp đồng
contractAcceptedEvent|모험가 파티 의뢰 수락|Adventurer party accepted|冒険者が依頼受諾|冒险者队伍已接受|Nhóm mạo hiểm đã nhận
contractCompleteEvent|토벌 의뢰 완료|Contract completed|討伐依頼完了|讨伐委托完成|Hợp đồng hoàn tất
devPanel|개발자 도구|Developer tools|開発者ツール|开发者工具|Công cụ phát triển
devNote|테스트 수치 · 운영 밸런스 미확정|Test values · production balance undecided|試験値 · 運用バランス未定|测试数值 · 运营平衡未定|Giá trị thử · cân bằng chưa chốt
devBreak|던전 폭주 발생시키기|Trigger dungeon break|暴走を発生|触发地下城暴走|Kích hoạt bùng phát
devInstantRaid|즉시 공략 · 테스트|Instant raid · test|即時攻略 · 試験|即时攻略 · 测试|Đột kích tức thì · thử
devAether|에테르 +20|Aether +20|エーテル +20|以太 +20|Aether +20
devSaturation|몬스터 포화도 +20|Monster saturation +20|モンスター圧力 +20|怪物压力 +20|Áp lực quái +20
devTreasury|금고 +5000|Treasury +5000|金庫 +5000|金库 +5000|Ngân khố +5000
close|닫기|Close|閉じる|关闭|Đóng
grade|던전 등급|Dungeon grade|ダンジョン等級|地下城等级|Hạng hầm ngục
cycleShort|다음 주기|Next cycle|次の周期|下个周期|Chu kỳ sau
prototypeShort|영지 플레이 프로토타입|Fief gameplay prototype|領地プレイ試作|领地玩法原型|Nguyên mẫu chơi lãnh địa
noEvents|아직 사건이 없습니다.|No events yet.|事件なし。|暂无事件。|Chưa có sự kiện.`;
const managementRows = `saturation|몬스터 포화도|Monster saturation|モンスター飽和度|怪物饱和度|Độ bão hòa quái vật
devSaturation|포화도 +20|Saturation +20|飽和度 +20|饱和度 +20|Bão hòa +20
devSaturationDown|포화도 −20|Saturation −20|飽和度 −20|饱和度 −20|Bão hòa −20
prosperity|번영도|Prosperity|繁栄度|繁荣度|Thịnh vượng
recruit|모병|Recruitment|募兵|募兵|Tuyển quân
living|생존 병력 · 수용 한도|Living soldiers · capacity|生存兵力 · 定員|存活兵力 · 容量|Quân sống · sức chứa
healthy|정상|Healthy|正常|健康|Khỏe
wounded|부상|Wounded|負傷|受伤|Bị thương
dead|누적 전사|Dead total|累計戦死|累计阵亡|Tổng tử trận
available|성 방어 가용|Available defense|城防衛可能|可用城防兵力|Quân phòng thủ khả dụng
standingAssigned|상시 배치|Standing assigned|常設配置|常驻派遣|Thường trực đã bố trí
emergencyAssigned|긴급 배치|Emergency assigned|緊急配置|紧急派遣|Khẩn cấp đã bố trí
standing|상시 토벌대|Standing suppression force|常設討伐隊|常驻讨伐队|Đội trấn áp thường trực
assignedCount|배치 인원|Assigned soldiers|配置人数|派遣人数|Số quân bố trí
applyAssignment|배치 적용|Apply assignment|配置適用|应用派遣|Áp dụng bố trí
standingHint|반복 출격 없이 포화도를 억제합니다. 부상·전사로 배치 인원이 줄 수 있습니다.|Automatically suppresses saturation. Wounds and deaths reduce assigned troops.|自動で飽和度を抑制。負傷・戦死で人数が減ります。|自动压制饱和度。伤亡会减少派遣兵力。|Tự động giảm bão hòa. Thương vong làm giảm quân bố trí.
suppressionEffect|현재 억제량|Current suppression|現在の抑制量|当前压制量|Mức trấn áp hiện tại
casualties|누적 토벌 손실|Suppression casualties|累計討伐損失|累计讨伐伤亡|Thương vong trấn áp
recruitCount|모집 인원|Recruit count|募集人数|招募人数|Số quân tuyển
maxCount|1회 최대|Maximum per job|一回の上限|单次上限|Tối đa mỗi đợt
recruitStart|모병 시작|Start recruitment|募兵開始|开始募兵|Bắt đầu tuyển
recruiting|모병 진행 중|Recruiting|募兵中|募兵进行中|Đang tuyển quân
recruited|모병 완료|Recruitment completed|募兵完了|募兵完成|Tuyển quân hoàn tất
recruitReady|모병 대기|Ready to recruit|募兵待機|待命募兵|Sẵn sàng tuyển
invalidCount|가용 병력과 인원 범위를 확인하세요.|Check available troops and count limits.|兵力と人数の範囲を確認。|请检查可用兵力和人数范围。|Kiểm tra quân khả dụng và giới hạn.
emergency|긴급 토벌대|Emergency suppression force|緊急討伐隊|紧急讨伐队|Đội trấn áp khẩn cấp
deployCount|투입 인원|Deployment count|投入人数|投入人数|Số quân triển khai
emergencyStart|긴급 토벌 출격|Deploy emergency force|緊急討伐出撃|派出紧急讨伐队|Triển khai đội khẩn cấp
emergencyProgress|긴급 토벌 중|Emergency suppression in progress|緊急討伐中|紧急讨伐进行中|Đang trấn áp khẩn cấp
emergencyDone|긴급 토벌 완료|Emergency suppression completed|緊急討伐完了|紧急讨伐完成|Trấn áp khẩn cấp hoàn tất
emergencyReady|긴급 토벌 대기|Emergency force ready|緊急討伐待機|紧急讨伐待命|Đội khẩn cấp sẵn sàng
emergencyHint|성 방어 가용 병력만 투입합니다. 빠르게 포화도를 낮추지만 부상·전사가 더 많습니다.|Uses available defense troops. Faster suppression brings heavier casualties.|防衛可能兵のみ投入。速い討伐には多くの損失。|仅投入可用城防兵力。快速压制伴随更大伤亡。|Dùng quân khả dụng. Trấn áp nhanh hơn nhưng thương vong cao hơn.
soldierRecovery|부상병 회복|Wounded recovery|負傷兵回復|伤兵恢复|Hồi phục thương binh
nextRecovery|다음 복귀까지|Next return in|次の復帰まで|下次归队倒计时|Lần trở lại tiếp theo
noWounded|회복 대기 중인 부상병이 없습니다.|No wounded soldiers awaiting recovery.|回復待ちの負傷兵なし。|没有等待恢复的伤兵。|Không có thương binh chờ hồi phục.
recoveryHint|부상병은 자동 회복합니다. 전사자는 모병으로 충원해야 합니다.|Wounded soldiers recover automatically. Replace the dead through recruitment.|負傷兵は自動回復。戦死者は募兵で補充。|伤兵自动恢复。阵亡兵力需通过募兵补充。|Thương binh tự hồi phục. Tuyển quân để bù tử trận.
taxPolicy|세금 정책|Tax policy|税制|税收政策|Chính sách thuế
taxLOW|낮은 세율|Low tax|低税率|低税率|Thuế thấp
taxNORMAL|보통 세율|Normal tax|標準税率|普通税率|Thuế thường
taxHIGH|높은 세율|High tax|高税率|高税率|Thuế cao
cooldown|변경 대기|Change cooldown|変更待機|变更冷却|Chờ thay đổi
changeReady|변경 가능|Change available|変更可能|可变更|Có thể thay đổi
taxHint|낮은 세율은 회복을 돕고, 높은 세율은 세입을 늘리지만 민심·번영도에 장기 부담을 줍니다.|Low tax helps recovery. High tax raises revenue but burdens sentiment and prosperity over time.|低税は回復支援。高税は増収だが民心と繁栄に長期負担。|低税有利于恢复。高税增加税收，但长期影响民心和繁荣度。|Thuế thấp giúp hồi phục. Thuế cao tăng thu nhưng gây áp lực lâu dài.
activePolicies|활성 정책|Active policies|有効な政策|生效政策|Chính sách đang hoạt động
policyActive|활성|Active|有効|生效|Hoạt động
policyInactive|비활성|Inactive|無効|未生效|Không hoạt động
policyLocked|미해금|Locked|未解放|未解锁|Chưa mở
unlockLevel|해금 장원|Manor unlock|解放荘園|解锁庄园等级|Cấp trang viên mở
RESIDENT_RELIEF|주민 지원|Resident relief|住民支援|居民援助|Hỗ trợ cư dân
COMMERCE_SUPPORT|상업 지원|Commerce support|商業支援|商业援助|Hỗ trợ thương mại
SECURITY_SUPPORT|치안 지원|Security support|治安支援|治安援助|Hỗ trợ an ninh
RECRUITMENT_SUPPORT|모병 지원|Recruitment support|募兵支援|募兵援助|Hỗ trợ tuyển quân
RECONSTRUCTION|재건 지원|Reconstruction|復興支援|重建援助|Tái thiết
RESIDENT_RELIEFHint|안정 후 민심 회복을 돕습니다.|Supports sentiment recovery after stability.|安定後の民心回復支援。|稳定后促进民心恢复。|Giúp lòng dân hồi phục sau ổn định.
COMMERCE_SUPPORTHint|안정 후 번영도 회복을 돕습니다.|Supports prosperity recovery after stability.|安定後の繁栄回復支援。|稳定后促进繁荣度恢复。|Giúp thịnh vượng hồi phục sau ổn định.
SECURITY_SUPPORTHint|안전권에서 치안 회복을 돕습니다.|Supports security recovery in safe conditions.|安全時の治安回復支援。|安全时促进治安恢复。|Giúp an ninh hồi phục khi an toàn.
RECRUITMENT_SUPPORTHint|새 모병 작업의 비용과 시간을 줄입니다.|Reduces cost and time for new recruitment jobs.|新規募兵の費用と時間を削減。|减少新募兵任务的费用和时间。|Giảm phí và thời gian đợt tuyển mới.
RECONSTRUCTIONHint|사고 후 안정되면 세 상태의 회복을 돕습니다.|Supports all three recoveries once conditions stabilize after incidents.|事故後の安定時に全状態の回復支援。|事故后稳定时促进三项状态恢复。|Giúp cả ba trạng thái hồi phục sau sự cố khi ổn định.
policyFundingHint|정책은 유지비가 듭니다. 결산 시 비용이 부족하면 활성 정책을 모두 중지합니다.|Policies require upkeep. Insufficient funds at settlement stop all active policies.|政策は維持費が必要。精算時の不足で全政策停止。|政策需要维护费。结算资金不足时停止所有生效政策。|Chính sách tốn phí duy trì. Thiếu quỹ khi quyết toán sẽ dừng tất cả.
taxRevenue|예상 세입|Estimated tax revenue|予想税収|预计税收|Thuế thu dự kiến
soldierUpkeep|병력 유지비|Soldier upkeep|兵力維持費|兵力维护费|Phí duy trì quân
policyUpkeep|정책 유지비|Policy upkeep|政策維持費|政策维护费|Phí duy trì chính sách
nextEconomyTick|다음 결산|Next settlement|次の精算|下次结算|Quyết toán tiếp theo
lastSettlement|최근 결산|Last settlement|前回精算|最近结算|Quyết toán gần nhất
stateStable|안정|Stable|安定|稳定|Ổn định
stateCaution|주의|Caution|注意|注意|Chú ý
stateUnrest|불안|Unsettled|不安|不安|Bất ổn
stateCrisis|위기|Crisis|危機|危机|Khủng hoảng
stateHint|포화도를 오래 방치하면 치안부터 손상됩니다. 원인을 해결한 뒤 안정 기간을 유지해야 서서히 회복합니다.|Prolonged saturation harms security first. Resolve threats and maintain stability for gradual recovery.|飽和を放置すると治安から悪化。脅威解消後の安定期間で徐々に回復。|长期放任饱和会先损害治安。消除威胁并保持稳定后逐步恢复。|Bão hòa kéo dài hại an ninh trước. Giải quyết nguy cơ và giữ ổn định để hồi phục dần.
cityEconomyHint|도시 레벨과 번영도가 세입 잠재력을 결정합니다. 시설 성장은 DEV에서만 시험합니다.|City level and prosperity determine tax potential. Building growth is tested in DEV.|都市レベルと繁栄が税収力を決定。成長はDEVで試験。|城市等级和繁荣度决定税收潜力。设施升级仅在DEV中测试。|Cấp đô thị và thịnh vượng quyết định tiềm năng thuế. Tăng cấp được thử trong DEV.
woundedWarning|부상병 회복 대기|Wounded awaiting recovery|負傷兵の回復待ち|伤兵等待恢复|Thương binh chờ hồi phục
defenseWarning|성 방어 가용 병력 없음|No available defense troops|防衛可能兵なし|无可用城防兵力|Không có quân phòng thủ khả dụng
fundingWarning|운영 자금 부족|Operating funds insufficient|運営資金不足|运营资金不足|Thiếu quỹ vận hành
recruitStartedEvent|모병 시작|Recruitment started|募兵開始|开始募兵|Bắt đầu tuyển quân
standingChangedEvent|상시 토벌 배치 변경|Standing assignment changed|常設配置変更|常驻派遣变更|Đổi bố trí thường trực
standingCasualtyEvent|상시 토벌 부상·전사|Standing suppression casualties|常設討伐損失|常驻讨伐伤亡|Thương vong thường trực
emergencyStartedEvent|긴급 토벌 출격|Emergency force deployed|緊急討伐出撃|紧急讨伐出击|Đội khẩn cấp xuất phát
emergencyCompleteEvent|긴급 토벌 완료·병력 복귀|Emergency completed · survivors returned|緊急討伐完了・生存者復帰|紧急讨伐完成·生还兵力归队|Hoàn tất khẩn cấp · quân sống trở lại
soldiersRecoveredEvent|부상병 정상 복귀|Wounded returned healthy|負傷兵正常復帰|伤兵恢复归队|Thương binh hồi phục trở lại
taxChangedEvent|세금 정책 변경|Tax policy changed|税制変更|税收政策变更|Đổi chính sách thuế
policyChangedEvent|활성 정책 변경|Active policy changed|政策変更|生效政策变更|Đổi chính sách hoạt động
policySuspendedEvent|자금 부족·정책 중지|Insufficient funds · policies stopped|資金不足・政策停止|资金不足·政策停止|Thiếu quỹ · dừng chính sách
economyTickEvent|세입·유지비 결산|Revenue and upkeep settled|税収・維持費精算|税收·维护费结算|Quyết toán thu và chi
manorLevel|장원 레벨 · 테스트|Manor level · test|荘園レベル · 試験|庄园等级 · 测试|Cấp trang viên · thử
aetherShort|내부 에테르|Internal aether|内部エーテル|内部以太|Aether bên trong
devStates|영지 상태 30 · 테스트|Territory states 30 · test|領地状態30 · 試験|领地状态30 · 测试|Trạng thái lãnh địa 30 · thử`;
const recoveryRows = `devEmptyTreasury|금고 비우기 · 테스트|Empty treasury · test|金庫を空に · 試験|清空金库 · 测试|Rút hết ngân khố · thử
recoveryStatus|영지 회복|Territory recovery|領地回復|领地恢复|Hồi phục lãnh địa
recovering|점진 회복 중|Recovering gradually|徐々に回復中|逐步恢复中|Đang hồi phục dần
stabilityWait|안정 유지|Maintain stability|安定維持|保持稳定|Duy trì ổn định
recoveryBlocked|위험·병력·안정 조건 대기|Waiting for safety, troops and stability|安全・兵力・安定条件待ち|等待安全、兵力和稳定条件|Chờ điều kiện an toàn, quân lực và ổn định`;
const entries = Object.fromEntries(
  (rows + '\n' + gameplayRows + '\n' + managementRows + '\n' + recoveryRows)
    .split('\n')
    .map((row) => {
      const [key, ...values] = row.split('|');
      return [key, values];
    }),
);
export function useFiefCopy() {
  const { language } = useTranslation();
  const index = ({ ko: 0, en: 1, ja: 2, 'zh-CN': 3, vi: 4 } as const)[language];
  return { language, t: (key: string) => entries[key]?.[index] ?? entries[key]?.[1] ?? key };
}
