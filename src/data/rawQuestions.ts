// Helper script to parse and shuffle So Cap 1 questions
import fs from 'fs';

export const RAW_SO_CAP_1 = `
Câu 1: Thiên Chúa nói cho ta biết về Người là Cha yêu thương qua những điều gì và những ai? (Bài 1, câu 1, trang 8)
A. Qua công trình tạo dựng
B. Qua các tổ phụ, qua cha mẹ ta
C. Qua cha quản xứ, qua thầy cô giáo lý viên
D. Qua thiên nhiên, qua các tổ phụ, các ngôn sứ và nhất là qua Chúa Giê-su
Câu 2: Cuốn sách nào ghi lời Thiên Chúa nói với ta? (Bài 1, câu 2, trang 8)
A. Sách giáo lý
B. Sách kinh
C. Sách giáo khoa
D. Sách Kinh Thánh
Câu 3: Việc chăm đọc Kinh Thánh giúp ta điều gì? (Bài 1, câu 3, trang 8)
A. Giúp ta hiểu biết về khoa học
B. Giúp ta hiểu biết về dân Do Thái
C. Giúp ta biết về lịch sử nhân loại
D. Giúp ta được biết và yêu mến Thiên Chúa
Câu 4: Em hãy cho biết Thiên Chúa là Đấng nào? (Bài 2, câu 1, trang 11)
A. Thiên Chúa là Đấng duy nhất 
B. Thiên Chúa là Đấng thánh thiện 
C. Thiên Chúa là Đấng quyền năng và yêu thương vô cùng
D. Cả A, B và C
Câu 5: Thiên Chúa ở những nơi nào? (Bài 2, câu 2, trang 11)
A. Trong nhà thờ
B. Trên trái đất
C. Trên bầu trời
D. Khắp mọi nơi
Câu 6: Vì sao ta không thấy Thiên Chúa? (Bài 2, câu 3, trang 11)
A. Vì mắt ta không có khả năng nhìn thấy được
B. Vì Thiên Chúa ở quá xa
C. Vì Thiên Chúa không muốn con người nhận biết Người
D. Vì Thiên Chúa là Đấng thiêng liêng
Câu 7: Thiên Chúa có thấy ta không? (Bài 2, câu 4, trang 11)
A. Thiên Chúa chỉ thấy các việc tốt ta làm
B. Thiên Chúa chỉ thấy các việc xấu ta làm
C. Thiên Chúa chỉ thấy ta theo vẻ bề ngoài
D. Thiên Chúa thấy ta rõ ràng, Người biết cả những ý nghĩ thầm kín trong ta
Câu 8: Ai tạo dựng nên trời đất? (Bài 3, câu 1, trang 13)
A. Trời đất tự nhiên mà có
B. Các thiên thần
C. Các thánh
D. Thiên Chúa
Câu 9: Thiên Chúa dùng cách nào để tạo dựng trời đất? (Bài 3, câu 2, trang 13)
A. Thiên Chúa dùng đất đá có sẵn mà tạo ra mọi sự
B. Thiên Chúa dùng không khí và nước để tạo ra mọi sự
C. Thiên Chúa bắt các thiên thần xây dựng
D. Thiên Chúa phán một lời liền có mọi sự
Câu 10: Khi tạo dựng trời đất muôn vật, Thiên Chúa muốn cho ta biết điều gì? (Bài 3, câu 3, trang 13)
A. Thiên Chúa là Cha yêu thương
B. Thiên Chúa ban sự tốt lành của Người cho muôn loài muôn vật
C. Thiên Chúa tạo dựng mọi sự để chúng phục vụ cho Người
D. Cả A và B
Câu 11: Để biết ơn Thiên Chúa đã tạo dựng mọi sự, ta phải làm gì? (Bài 3, câu 4, trang 13)
A. Ta cần cầu xin Thiên Chúa tiếp tục tạo dựng
B. Ta cần siêng năng làm việc để có nhiều của cải
C. Ta không cần phải làm gì cả vì đó là do Thiên Chúa tự nguyện
D. Ta phải cùng nhau làm việc để trái đất này được tốt đẹp hơn
Câu 12: Con người được Thiên Chúa tạo dựng giống ai? (Bài 4, câu 1, trang 15)
A. Giống vượn người
B. Giống các thiên thần
C. Giống các thánh trên trời
D. Giống hình ảnh Thiên Chúa
Câu 13: Con người giống hình ảnh Thiên Chúa ở điểm nào? (Bài 4, câu 2, trang 15)
A. Có khả năng nhận biết Thiên Chúa
B. Có khả năng yêu mến Thiên Chúa
C. Có khả năng yêu thương mọi người
D. Cả A, B và C
Câu 14: Con người được Thiên Chúa tạo dựng nên để làm gì? (Bài 4, câu 3, trang 15)
A. Để xây dựng thế giới
B. Để làm chủ trời đất
C. Để dâng lễ cho Thiên Chúa
D. Để làm con Thiên Chúa và sống hạnh phúc với Người
Câu 15: Thiên Chúa chăm sóc ta như thế nào? (Bài 4, câu 4, trang 15)
A. Thiên Chúa ở trên trời quan sát ta từ xa
B. Thiên Chúa chỉ chăm sóc khi ta ốm đau
C. Thiên Chúa để mặc con người
D. Thiên Chúa luôn ở với ta, gìn giữ và ban mọi ơn lành hồn xác cho ta
Câu 16: Ta hiểu như thế nào về các thiên thần? (Bài 5, câu 1, trang 17)
A. Thiên thần là Ngôi Ba Thiên Chúa
B. Thiên thần là loài thiêng liêng tự mình mà có
C. Thiên thần là loài mà ta có thể nhìn thấy được
D. Thiên thần là loài thiêng liêng, do Thiên Chúa tạo nên
Câu 17: Thiên Chúa trao cho các thiên thần nhiệm vụ gì? (Bài 5, câu 2, trang 17)
A. Chiến đấu với ma quỷ và bảo vệ Thiên Chúa
B. Cai quản mọi sự thay cho Thiên Chúa
C. Cai quản con người
D. Thờ phượng Thiên Chúa và giúp đỡ loài người
Câu 18: Ma quỷ bởi đâu mà có? (Bài 5, câu 4, trang 17)
A. Ma quỷ là thụ tạo ở trong Luyện Ngục để cai quản các linh hồn
B. Ma quỷ là những thụ tạo được Thiên Chúa dựng
C. Ma quỷ là loài tự nhiên mà có
D. Ma quỷ là những thiên thần phản nghịch Thiên Chúa
Câu 19: Ta bị ma quỷ làm hại như thế nào? (Bài 5, câu 5, trang 17)
A. Ma quỷ chẳng thể làm hại được ta
B. Ma quỷ tìm mọi cách để làm hại ta về phần xác
C. Ma quỷ ép buộc ta phải chống lại Thiên Chúa
D. Ma quỷ cám dỗ ta phạm tội để ta xa cách Thiên Chúa
Câu 20: Tổ Tông loài người phạm tội gì? (Bài 6, câu 1, trang 19)
A. Tự ý ăn trái táo
B. Nói xúc phạm Thiên Chúa
C. Tự ý bỏ đi khỏi vườn Địa Đàng
D. Không vâng lời Thiên Chúa
Câu 21: Những thiệt hại do tội Tổ Tông gây ra như thế nào? (Bài 6, câu 2, trang 19)
A. Tội Tổ Tông làm cho loài người mất tình nghĩa với Thiên Chúa
B. Tội Tổ Tông làm cho loài người chia rẽ với nhau
C. Tội Tổ Tông làm cho loài người phải đau khổ và phải chết
D. Cả A, B và C
Câu 22: Loài người có bị Thiên Chúa bỏ rơi sau khi Tổ Tông phạm tội hay không? (Bài 6, câu 4, trang 19)
A. Thiên Chúa từ bỏ con người mãi mãi
B. Thiên Chúa không cho con người cơ hội sửa chữa
C. Thiên Chúa ghét bỏ con người
D. Thiên Chúa vẫn yêu thương loài người và hứa ban Đấng Cứu Thế
Câu 23: Thiên Chúa đã làm gì trước tiên để chuẩn bị cho Đấng Cứu Thế đến? (Bài 7, câu 1, trang 21)
A. Thiên Chúa đã chọn Mô-sê để đưa dân Ít-ra-en trở về từ Ai Cập
B. Thiên Chúa đã sai thiên thần báo tin cho Đức Ma-ri-a
C. Thiên Chúa đã gửi Gio-an Tẩy Giả đi trước để dọn đường
D. Thiên Chúa đã chọn ông Áp-ra-ham để lập một dân riêng
Câu 24: Ông Áp-ra-ham đã có thái độ nào khi được Thiên Chúa gọi?
A. Ông đã từ chối lời Thiên Chúa
B. Ông đã nghe Lời Chúa nhưng lại không chịu làm theo
C. Ông đã im lặng bỏ đi khi Chúa nói chuyện với ông
D. Ông đã mau mắn vâng lời và hoàn toàn tin tưởng vào Chúa
Câu 25: Ta học được ở nơi ông Áp-ra-ham điều gì? (Bài 7, câu 3, trang 21)
A. Ta học về sự kiên nhẫn
B. Ta học về sự nhịn nhục
C. Ta học về tinh thần trách nhiệm
D. Ta học về sự lắng nghe và làm theo Lời Chúa dạy
Câu 26: Dân nào được Thiên Chúa chọn làm dân riêng của Ngài? (Bài 8, câu 1, trang 23)
A. Dân Ai Cập
B. Dân Rô-ma
C. Dân Sa-ma-ri
D. Dân Ít-ra-en
Câu 27: Dân Ít-ra-en được Thiên Chúa chọn như thế nào? (Bài 8, câu 2, trang 23)
A. Thiên Chúa gọi một số người tại Rô-ma và đưa họ đến Ít-ra-en
B. Thiên Chúa chọn các ngôn sứ và cho họ đất Ít-ra-en
C. Thiên Chúa kêu gọi dân Ai Cập đến đất Ca-na-an sinh sống
D. Thiên Chúa giải phóng dân Ít-ra-en khỏi nô lệ Ai Cập và ký Giao ước với họ tại núi Xi-nai
Câu 28: Thiên Chúa dạy dân Ít-ra-en điều gì khi ký Giao ước với họ? (Bài 8, câu 3, trang 23)
A. Thiên Chúa dạy họ trồng trọt, chăn nuôi
B. Thiên Chúa dạy họ cách đối phó với kẻ thù
C. Thiên Chúa dạy họ đọc sách và viết chữ
D. Thiên Chúa dạy họ Mười Điều Răn
Câu 29: Giáo Hội đúc kết Mười Điều Răn thành mấy điều chính? (Bài 8, câu 4, trang 23)
A. Ba điều
B. Một điều
C. Bốn điều
D. Hai điều
Câu 30: Chúa Giê-su sinh ra ở đâu? (Bài 10, câu 1, trang 30)
A. Ai Cập
B. Giê-ru-sa-lem
C. Ca-na
D. Bê-lem
Câu 31: Cha nuôi của Chúa Giê-su là ai? (Bài 10, câu 2, trang 30)
A. Thánh Phê-rô
B. Vua Đa-vít
C. Thánh Phan-xi-cô
D. Thánh Giu-se
Câu 32: Bởi đâu Đức Ma-ri-a mang thai Chúa Giê-su? (Bài 10, câu 3, trang 30)
A. Bởi Lời Chúa hứa sau khi Tổ Tông phạm tội
B. Bởi Lời Chúa hứa với tổ phụ Áp-ra-ham
C. Bởi lời truyền tin của thiên thần Gáp-ri-en
D. Bởi quyền năng của Chúa Thánh Thần
Câu 33: Ta tin Chúa Giê-su là ai? (Bài 10, câu 4, trang 30)
A. Chúa Giê-su là một thụ tạo
B. Chúa Giê-su là một thiên sứ
C. Chúa Giê-su không phải là Thiên Chúa thật
D. Chúa Giê-su vừa là Thiên Chúa thật vừa là người thật
Câu 34: Đâu là nơi Chúa Giê-su sống tuổi thơ của Người? (Bài 11, câu 1, trang 32)
A. Ai Cập
B. Giê-ru-sa-lem
C. Sa-ma-ri
D. Na-da-rét
Câu 35: Cuộc sống của Chúa Giê-su tại Na-da-rét dạy ta điều gì? (Bài 11, câu 2, trang 32)
A. Dạy ta sống hòa đồng với bạn bè
B. Dạy ta hiếu thảo cha mẹ
C. Dạy ta siêng năng làm việc
D. Dạy ta luôn vâng lời cha mẹ và hằng làm đẹp lòng Thiên Chúa
Câu 36: Ta học nơi Chúa Giê-su bài học gì về cách sống trong gia đình? (Bài 11, câu 3, trang 32)
A. Yêu mến và vâng lời ông bà, cha mẹ
B. Yêu thương và giúp đỡ anh chị em
C. Mọi việc trong gia đình để bố mẹ lo
D. Cả A và B
Câu 37: Ta học nơi Chúa Giê-su bài học gì về cách sống nơi trường học và lối xóm? (Bài 11, câu 4, trang 32)
A. Vui tươi với mọi người
B. Kính trọng, yêu thương và giúp đỡ mọi người
C. Chăm chỉ học hành
D. Cả B và C
Câu 38: Chúa Giê-su bắt đầu rao giảng Tin Mừng khi Người bao nhiêu tuổi? (Bài 12, câu 1, trang 34)
A. 12 tuổi
B. 20 tuổi
C. 33 tuổi
D. 30 tuổi
Câu 39: Chúa Giê-su đã làm những gì trước khi bắt đầu đi rao giảng Tin Mừng? (Bài 12, câu 2, trang 34)
A. Chúa Giê-su đến sông Gio-đan
B. Chịu phép rửa của ông Gio-an
C. Ăn chay cầu nguyện 40 ngày trong hoang địa
D. Cả A, B và C
Câu 40: Chúa Giê-su mời gọi ta làm gì khi Người rao giảng Tin Mừng? (Bài 12, câu 3, trang 34)
A. Chăm chỉ làm việc
B. Đến chịu phép rửa của Gio-an Tẩy Giả
C. Từ bỏ cha mẹ để đi theo Người
D. Sám hối và tin vào Tin Mừng
Câu 41: Chúa Giê-su đã làm gì để chứng tỏ Người là Con Thiên Chúa? (Bài 13, câu 2, trang 36)
A. Chăm chỉ làm việc
B. Tranh luận với dân Do Thái
C. Làm nhiều việc tốt
D. Làm nhiều phép lạ
Câu 42: Chúa Giê-su mời gọi ta làm gì khi chứng kiến những phép lạ của Người? (Bài 13, câu 3, trang 36)
A. Học hỏi các phép lạ của Người
B. Ăn năn sám hối
C. Chờ đợi Người khi ta gặp đau khổ
D. Tin Người là Đấng Cứu Thế
Câu 43: Chúa Giê-su đã chọn bao nhiêu Tông Đồ? (Bài 14, câu 1, trang 38)
A. 11
B. 14
C. 13
D. 12
Câu 44: Chúa Giê-su đã trao sứ vụ gì cho các Tông Đồ? (Bài 14, câu 2, trang 38)
A. Bảo vệ Người
B. Chăm sóc dân chúng
C. Đi theo nghe Người giảng
D. Đi rao giảng Tin Mừng
Câu 45: Ai được Chúa Giê-su đặt làm đầu các Tông Đồ? (Bài 14, câu 3, trang 38)
A. Thánh Gio-an
B. Thánh Phao-lô
C. Thánh Tô-ma
D. Thánh Phê-rô
Câu 46: Chúa Giê-su dành thời gian cầu nguyện và sống gắn bó mật thiết với ai? (Bài 15, câu 1, trang 40)
A. Với ông Mô-sê
B. Với ông Ap-ra-ham
C. Với Đức Ma-ri-a
D. Với Chúa Cha
Câu 47: Chúa Giê-su thường cầu nguyện vào những thời điểm nào trong ngày? (Bài 15, câu 2, trang 40)
A. Vào buổi sáng sớm
B. Vào buổi chiều
C. Vào buổi tối
D. Mọi lúc mọi nơi, nhất là trước những việc quan trọng
Câu 48: Tại sao Chúa Giê-su phải cầu nguyện? (Bài 15, câu 3, trang 40)
A. Để tìm niềm vui
B. Để xin ơn cho những người nghèo
C. Để Chúa Cha cho làm phép lạ
D. Để nhận ra ý Chúa Cha mà sống đẹp lòng Người
Câu 49: Noi gương Chúa Giê-su, hằng ngày ta cầu nguyện như thế nào? (Bài 15, câu 4, trang 40)
A. Thường xuyên hướng lòng lên Thiên Chúa
B. Thưa chuyện thân mật với Thiên Chúa
C. Lắng nghe Thiên Chúa dạy dỗ
D. Cả A, B và C
Câu 50: Ai dạy ta cầu nguyện bằng kinh Lạy Cha? (Bài 16, câu 1, trang 42)
A. Cha mẹ
B. Thầy cô
C. Đức Mẹ
D. Chúa Giê-su
Câu 51: Ta có thể cầu nguyện với tâm tình nào nhờ kinh Lạy Cha? (Bài 16, câu 2, trang 42)
A. Tâm tình đơn sơ
B. Tâm tình tin tưởng
C. Tâm tình mến yêu
D. Cả A, B và C
Câu 52: Trong kinh Lạy Cha, có mấy ý nguyện? (Bài 16, câu 3-câu 4, trang 42)
A. Bốn ý nguyện
B. Năm ý nguyện
C. Sáu ý nguyện
D. Bảy ý nguyện
Câu 53: Ta xin những gì qua ba ý nguyện đầu của kinh Lạy Cha? (Bài 16, câu 3, trang 42)
A. Danh Cha cả sáng
B. Nước Cha trị đến
C. Ý Cha thể hiện dưới đất cũng như trên trời
D. Cả A, B và C
Câu 54: Ta xin những gì qua bốn ý nguyện sau của kinh Lạy Cha? (Bài 16, câu 4, trang 42)
A. Xin cho ta có lương thực thật nhiều, được tha thứ tội lỗi, không sa chước cám dỗ, được cứu khỏi mọi sự dữ
B. Xin cho ta lương thực hằng ngày, tha thứ tội lỗi, không có cám dỗ, cứu khỏi mọi sự dữ
C. Xin cho ta có lương thực hằng ngày, được tha thứ tội lỗi, khỏi sa chước cám dỗ, không có sự dữ nào.
D. Xin cho ta có lương thực hằng ngày, xin tha thứ tội lỗi, đừng để ta sa chước cám dỗ, cứu ta khỏi mọi sự dữ
Câu 55: Để sống tinh thần cầu nguyện, trước khi đi ngủ, ta phải làm gì? (Bài 17, câu 2, trang 44)
A. Ta làm Dấu Thánh Giá
B. Tạ ơn vì những ơn Chúa ban trong ngày
C. Xin thứ tha tội lỗi và phó dâng hồn xác trong tay Chúa
D. Cả A, B và C
Câu 56: Trước và sau khi ăn cơm, người Công Giáo thường phải làm gì? (Bài 17, câu 3, trang 44)
A. Trước khi ăn cơm ta làm Dấu Thánh Giá,
B. Xin Chúa chúc lành cho của ăn; sau khi ăn, ta cám ơn Chúa
C. Trước khi ăn cơm ta mời mọi người cùng ăn cơm với ta
D. Cả A và B
Câu 57: Để biết làm mọi sự đẹp ý Chúa, ta cầu nguyện như thế nào? (Bài 17, câu 4, trang 44)
A. Cầu cho có nhiều của cải
B. Cầu cho được thành đạt
C. Đọc kinh thật nhiều
D. Cầu xin Chúa Thánh Thần soi sáng
Câu 58: Bữa ăn cuối cùng Chúa Giê-su mừng lễ Vượt Qua với các Tông Đồ trước ngày Người chịu chết được gọi là gì? (Bài 18, câu 1, trang 46)
A. Tiệc cưới
B. Tiệc sinh nhật
C. Tiệc ngọt
D. Bữa Tiệc Ly
Câu 59: Chúa Giê-su đã làm những gì trong Bữa Tiệc Ly? (Bài 18, câu 2, trang 46)
A. Chúa Giê-su đã rửa chân cho các Tông Đồ
B. Chúa Giê-su đã ban lệnh truyền yêu thương
C. Chúa Giê-su đã lập bí tích Thánh Thể
D. Cả A, B và C
Câu 60: Trong Bữa Tiệc Ly, Chúa Giê-su đã trao lệnh truyền gì cho các Tông Đồ? (Bài 18, câu 3, trang 46)
A. Lệnh truyền loan báo Tin Mừng
B. Lệnh truyền chữa bệnh
C. Lệnh truyền cai quản Hội Thánh
D. Lệnh truyền yêu thương
Câu 61: Qua bí tích Thánh Thể, Chúa Giê-su ban Mình và Máu Thánh Người để làm gì cho ta? (Bài 18, câu 4, trang 46)
A. Để nuôi sống phần xác
B. Để ta biết Người là Thiên Chúa
C. Để ta biết Người là người thật
D. Để làm của ăn nuôi sống linh hồn ta
Câu 62: Ta biết gì về bản án tử hình mà Chúa Giê-su phải chịu? (Bài 19, câu 1, trang 48)
A. Người bị chém đầu
B. Người bị ném đá đến chết
C. Người bị đánh đòn cho đến chết
D. Người bị đóng đinh và chết trên thập giá tại núi Sọ
Câu 63: Chúa Giê-su chịu chết vào ngày nào? (Bài 19, câu 2, trang 48)
A. Vào ngày Lễ Lều
B. Vào ngày Sa-bát
C. Vào ngày thứ nhất trong tuần
D. Ngày thứ sáu áp lễ Vượt Qua
Câu 64: Tại sao Chúa Giê-su chịu chết? (Bài 19, câu 3, trang 48)
A. Vì Chúa chống lại quân đội Rô-ma
B. Vì Chúa Giê-su vi phạm lề luật của người Do Thái
C. Vì Chúa chống đối các luật sỹ và Pha-ri-siêu
D. Vì Chúa muốn cứu chuộc loài người
Câu 65: Biến cố trọng đại nào đã diễn ra sau khi Chúa Giê-su chết ba ngày? (Bài 20, câu 1, trang 50)
A. Các Tông Đồ lẩn trốn người Do Thái
B. Một số Tông Đồ đi trộm xác Chúa
C. Quan Phi-la-tô cho người bắt tất cả các Tông Đồ và giết chết họ
D. Chúa Giê-su sống lại như lời Người đã báo trước
Câu 66: Chúa Giê-su sống lại bao nhiêu ngày rồi Người về Trời? (Bài 20, câu 2, trang 50)
A. 10 ngày
B. 7 ngày
C. 50 ngày
D. 40 ngày
Câu 67: Ta phải sống thế nào để bày tỏ niềm tin vào Chúa Giê-su Phục Sinh? (Bài 20, câu 3, trang 50)
A. Sống vui tươi
B. Tin tưởng
C. Trung thành giữ luật Chúa
D. Cả A, B và C
Câu 68: Ta nhận được ơn gì qua sự chết và sống lại của Chúa Giê-su? (Bài 21, câu 1, trang 52)
A. Ta chiến thắng mọi cám dỗ và khỏi chết phần xác
B. Ta được giải thoát khỏi tội lỗi
C. Ta được sự sống mới của người làm con Thiên Chúa
D. Cả B và C
Câu 69: Ta có được sự sống mới của người làm con Thiên Chúa từ lúc nào? (Bài 21, câu 2, trang 52)
A. Ngay khi ta được sinh ra trên trần gian này
B. Ngay khi ta kết thúc sự sống trần gian
C. Khi ta được kết hiệp mật thiết với Chúa trên Thiên Đàng
D. Khi ta tin vào Chúa Giê-su và chịu phép Rửa Tội
Câu 70: Để nuôi dưỡng sự sống mới của người làm con Thiên Chúa, ta phải làm gì? (Bài 21, câu 3, trang 52)
A. Ta phải cố gắng ăn uống
B. Ta phải luyện tập thể dục thể thao
C. Ta phải siêng năng học hành
D. Ta phải gắn bó với Chúa Giê-su và sống theo lời Người dạy
Câu 71: Biến cố trọng đại gì đã xảy ra sau khi Chúa Giê-su sống lại bốn mươi ngày? (Bài 22, câu 1, trang 54)
A. Chúa Giê-su xuống Ngục Tổ Tông cứu các linh hồn
B. Chúa Giê-su tiếp tục đi khắp thế gian rao giảng Tin Mừng
C. Chúa Giê-su tiếp tục ở lại để dạy dỗ cho các môn đệ
D. Chúa Giê-su lên trời ngự bên hữu Chúa Cha
Câu 72: Lên trời rồi, Chúa Giê-su còn ở lại với ta nữa không? (Bài 22, câu 2, trang 54)
A. Chúa Giê-su đã lìa bỏ ta
B. Chúa Giê-su thỉnh thoảng đến thế gian thăm ta
C. Chúa Giê-su phải đợi đến ngày tận thế để đến với ta
D. Nhờ Hội Thánh, Chúa Giê-su vẫn ở lại mọi ngày cho đến tận thế
Câu 73: Vào ngày tận thế, Chúa Giê-su đến trần gian để làm gì? (Bài 22, câu 3, trang 54)
A. Để tiếp tục dạy dỗ các Tông Đồ
B. Để tiếp tục sứ mạng còn dang dở của Người
C. Để hoàn tất lời hứa ở lại mọi ngày với các Tông Đồ
D. Để phán xét kẻ sống và kẻ chết
Câu 74: Ngôi Ba Thiên Chúa là ai? (Bài 24, câu 1, trang 61)
A. Thiên thần
B. Chúa Cha
C. Chúa Con
D. Chúa Thánh Thần
Câu 75: Đấng Bảo Trợ là tên gọi chỉ về ai? (Bài 24, câu 2, trang 61)
A. Đức Mẹ
B. Thánh Giu-se
C. Chúa Giê-su
D. Chúa Thánh Thần
Câu 76: Những hình ảnh nào sau đây chỉ Chúa Thánh Thần? (Bài 24, câu 3, trang 61)
A. Đất và nước
B. Lửa và mặt trăng
C. Áng mây và bầu trời
D. Nước, lửa, chim bồ câu
Câu 77: Bí tích nào ban cho ta tràn đầy Chúa Thánh Thần? (Bài 25, câu 1, trang 63)
A. Bí tích Hòa Giải
B. Bí tích Thánh Thể
C. Bí tích Xức Dầu
D. Bí tích Thêm Sức
Câu 78: Ai giúp ta sống kết hợp nên một với Chúa Giê-su và hướng dẫn ta sống mến Chúa yêu người? (Bài 25, câu 2, trang 63)
A. Thầy cô
B. Cha mẹ
C. Các thánh
D. Chúa Thánh Thần
Câu 79: Tin vào Chúa Thánh Thần, ta phải sống thế nào? (Bài 25, câu 3, trang 63)
A. Ta phải yêu mến Chúa Thánh Thần
B. Ta phải mau mắn nghe theo Người thúc đẩy
C. Ta phải luôn nhớ mình là đền thờ Chúa Thánh Thần
D. Cả A, B và C
Câu 80: Lệnh truyền ‘đi giảng dạy cho muôn dân và làm phép rửa cho họ’ được Chúa Giê-su ban cho các môn đệ lúc nào? (Bài 26, câu 1, trang 65)
A. Khi Người cầu nguyện
B. Sau khi về trời
C. Khi làm phép lạ
D. Trước khi về trời
Câu 81: Thiên Chúa có mấy Ngôi? (Bài 26, câu 2-câu 4, trang 65)
A. Một Ngôi
B. Bốn Ngôi
C. Hai Ngôi
D. Ba Ngôi
Câu 82: Có mấy Thiên Chúa? (Bài 26, câu 5, trang 65)
A. Có ba Thiên Chúa
B. Có bốn Thiên Chúa
C. Có hai Thiên Chúa
D. Có một Thiên Chúa duy nhất
Câu 83: Ai đã yêu thương, tạo dựng, chăm sóc và cứu chuộc ta? (Bài 27, câu 1, trang 67)
A. Bố mẹ
B. Các thiên thần
C. Đức Mẹ
D. Ba Ngôi Thiên Chúa
Câu 84: Đâu là mục đích quan trọng nhất của việc Ba Ngôi Thiên Chúa tạo dựng và chăm sóc ta? (Bài 27, câu 2, trang 67)
A. Để ta được hiện diện trên cõi đời này
B. Để ta sống hạnh phúc ở trần gian này
C. Để ta được gia nhập vào Hội Thánh
D. Để ta được chia sẻ cuộc sống hạnh phúc vô cùng với Thiên Chúa
Câu 85: Để đáp lại tình yêu của Ba Ngôi Thiên Chúa, ta phải làm gì? (Bài 27, câu 3, trang 67)
A. Ta phải chăm chỉ làm việc để làm giàu
B. Ta phải chăm chỉ học hành để có học thức
C. Ta phải siêng năng thể thao để mạnh khỏe
D. Ta phải thường xuyên cầu nguyện và làm mọi việc vì yêu mến
`;
