
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_TEXT } from '../constants';
import { PlacementTestData } from '../types';

const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("Không tìm thấy Gemini API Key trong process.env.API_KEY. Các tính năng AI sẽ bị vô hiệu hóa.");
}

function formatPlacementTestDataForGemini(ptData: PlacementTestData): string {
  let text = `Thông tin chung:\n`;
  if (ptData.courseName) {
    text += `- Khóa học hiện tại (nếu có): ${ptData.courseName}\n`;
  } else {
    text += `- Khóa học hiện tại: Chưa có thông tin (có thể là học viên mới hoặc chưa tham gia khóa nào tại hệ thống).\n`;
  }
  if (ptData.currentLevel) text += `- Trình độ hiện tại (dự kiến theo hệ thống): ${ptData.currentLevel}\n`;
  if (ptData.recommendedLevel) text += `- Trình độ đề xuất sau bài test: ${ptData.recommendedLevel}\n\n`;

  text += `Chi tiết kết quả các bài test:\n`;
  if (ptData.placementTestResults && ptData.placementTestResults.length > 0) {
    ptData.placementTestResults.forEach((testResult, index) => {
      text += `Bài test ${index + 1} - Trình độ mục tiêu: ${testResult.level || 'N/A'}\n`;
      text += `  - Kết quả tổng: ${testResult.correctCount} / ${testResult.correctTotal} câu đúng.\n`;
      if (testResult.skillScores && testResult.skillScores.length > 0) {
        text += `  - Điểm chi tiết theo kỹ năng:\n`;
        testResult.skillScores.forEach(skill => {
          text += `    * ${skill.skill}: ${skill.scores} điểm, ${skill.correctCount}/${skill.totalCount} câu đúng (${skill.percent}%).\n`;
        });
      }
      text += "\n";
    });
  } else {
    text += "Không có dữ liệu chi tiết bài test.\n";
  }
  return text;
}

interface StreamCallbacks {
  onChunk: (chunkText: string) => void;
  onError: (errorMessage: string) => void;
  onComplete: (fullText: string) => void;
}

export async function streamDetailedAnalysis(
  placementTestData: PlacementTestData,
  callbacks: StreamCallbacks
): Promise<void> {
  if (!ai) {
    callbacks.onError("Gemini AI client chưa được khởi tạo. API Key có thể bị thiếu.");
    callbacks.onComplete(""); // Ensure onComplete is called even on error to stop loading states
    return;
  }

  const testResultsText = formatPlacementTestDataForGemini(placementTestData);

  const analysisPrompt = `
      Trong vai trò là một giáo viên tiếng Anh giàu kinh nghiệm và một chuyên gia đánh giá năng lực, hãy phân tích kết quả bài kiểm tra năng lực đầu vào sau đây của một học sinh.
      Dữ liệu bài làm:
      ${testResultsText}

      YÊU CẦU VỀ NỘI DUNG PHÂN TÍCH:
      1.  Đưa ra nhận xét tổng quan về năng lực tiếng Anh hiện tại của học sinh dựa trên mối quan hệ tương quan giữa độ tuổi, cấp học tại trường, kết quả đầu vào, khung tham chiếu của bộ giáo dục, khung tham chiếu của CEFR. Không dùng thông tin "Khóa học hiện tại", hãy xem xét khả năng đây là học viên mới, chưa từng theo học chương trình tiếng Anh nào tại FSEL hoặc một lộ trình bài bản trước đó, và điều chỉnh nhận định cho phù hợp. Tập trung diễn giải kết quả, không viết dưới dạng kịch bản nói hoặc thư thông báo kết quả.
      2.  Phân tích chi tiết các điểm mạnh của học sinh theo từng kỹ năng (nếu có).
      3.  Xác định rõ các điểm cần cải thiện (điểm yếu) theo từng kỹ năng. Đối với mỗi điểm yếu, hãy:
          *   Nêu rõ bản chất của điểm yếu đó (ví dụ: hạn chế về từ vựng chủ đề X, chưa vững ngữ pháp Y, phát âm sai âm Z, nghe hiểu chi tiết còn yếu...).
          *   Đưa ra gợi ý cụ thể, mang tính xây dựng về cách cải thiện (ví dụ: "Cần tập trung vào việc mở rộng vốn từ vựng học thuật liên quan đến chủ đề khoa học và xã hội.", "Nên ôn luyện kỹ hơn về cách sử dụng thì quá khứ hoàn thành và câu điều kiện loại 2.", "Cần luyện tập phát âm các âm cuối /s/, /z/, /id/ một cách chính xác hơn.", "Tăng cường luyện nghe các bài hội thoại dài để cải thiện khả năng nắm bắt ý chính và các chi tiết quan trọng.").
      
      YÊU CẦU VỀ TRÌNH BÀY (RẤT QUAN TRỌNG):
      Vui lòng cấu trúc phản hồi của bạn MỘT CÁCH CHÍNH XÁC như sau, sử dụng các tiêu đề được đánh dấu bằng ## (cho H2) và ### (cho H3) một cách nhất quán. Sử dụng dấu ba gạch ngang (---) để tách biệt các khối lớn.

      ## Đánh Giá Tổng Quan Năng Lực
      [Liệt kê các nhận xét tổng quan CHÍNH YẾU của bạn dưới dạng GẠCH ĐẦU DÒNG (bullet points). Mỗi gạch đầu dòng nên là một ý ngắn gọn, súc tích, tập trung vào những phát hiện quan trọng nhất. Ví dụ:
      * Học sinh thể hiện khả năng Nghe hiểu tốt hơn so với các kỹ năng khác được đánh giá.
      * Vốn từ vựng còn hạn chế, đặc biệt là các từ vựng thuộc chủ đề học thuật.
      * Cần củng cố ngữ pháp về các thì phức tạp và cấu trúc câu điều kiện.
      * Kết quả tổng thể cho thấy trình độ hiện tại của học sinh có thể thấp hơn so với cấp lớp đang theo học tại trường phổ thông, cần lộ trình bổ trợ kiến thức nền tảng.]

      ---

      ## Phân Tích Chi Tiết Kỹ Năng: [Tên Kỹ Năng 1, ví dụ: Nghe Hiểu]
      ### Điểm Mạnh:
      [Liệt kê các điểm mạnh của kỹ năng này. Sử dụng gạch đầu dòng dạng: * Điểm mạnh A]
      ### Điểm Yếu:
      [Liệt kê các điểm yếu của kỹ năng này, dùng gạch đầu dòng hoặc đoạn văn.]
      ### Gợi Ý Cải Thiện:
      [Liệt kê các gợi ý cải thiện cho kỹ năng này. Dùng gạch đầu dòng và liên kết với các tính năng mà FSEL có thể giúp cải thiện.]

      ---

      ## Phân Tích Chi Tiết Kỹ Năng: [Tên Kỹ Năng 2, ví dụ: Đọc Hiểu]
      ### Điểm Mạnh:
      [Nội dung...]
      ### Điểm Yếu:
      [Nội dung...]

      (Lặp lại cấu trúc trên cho tất cả các kỹ năng được đánh giá trong bài test như Nói, Viết, Ngữ pháp, Từ vựng nếu có dữ liệu.)
      Đảm bảo mỗi phần kỹ năng được tách biệt bằng "---".
  `;
  
  let fullContent = "";
  try {
    const stream = await ai.models.generateContentStream({
        model: GEMINI_MODEL_TEXT,
        contents: [{ parts: [{text: analysisPrompt}] }],
    });
    for await (const chunk of stream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullContent += chunkText;
        callbacks.onChunk(chunkText);
      }
    }
    callbacks.onComplete(fullContent);
  } catch (e: any) {
    const errorMsg = `Lỗi từ Gemini (Phân tích): ${e.message || 'Lỗi không xác định'}`;
    callbacks.onError(errorMsg);
    callbacks.onComplete(fullContent); // Still call onComplete to signal end of process
  }
}

export async function streamTelemarketingScripts(
  fullAnalysisContent: string,
  placementTestData: PlacementTestData, // For context like course name, levels
  callbacks: StreamCallbacks
): Promise<void> {
  if (!ai) {
    callbacks.onError("Gemini AI client chưa được khởi tạo. API Key có thể bị thiếu.");
    callbacks.onComplete("");
    return;
  }
  if (!fullAnalysisContent) {
    callbacks.onError("Nội dung phân tích chi tiết bị trống. Không thể tạo kịch bản.");
    callbacks.onComplete("");
    return;
  }

  const telemarketingPrompt = `
      Dựa trên PHÂN TÍCH CHI TIẾT KẾT QUẢ BÀI KIỂM TRA NĂNG LỰC ĐẦU VÀO sau (đã bao gồm điểm mạnh, điểm yếu và gợi ý cải thiện):
      ${fullAnalysisContent.replace(/<br>/g, '\n')} 

      Và thông tin chung về học sinh:
      - Khóa học hiện tại (chỉ sử dụng thông tin này nếu như object là Client): ${placementTestData.courseName || "Chưa có thông tin (có thể là học viên mới)"}
      - Trình độ hiện tại (dự kiến theo hệ thống): ${placementTestData.currentLevel || "Chưa rõ"}
      - Trình độ đề xuất sau bài test: ${placementTestData.recommendedLevel || "Chưa rõ"}

      Trong vai trò là một chuyên viên tư vấn giáo dục cao cấp tại FSEL, hãy xây dựng 3 mẫu kịch bản telesales dẫn dắt tinh tế để tư vấn cho phụ huynh học sinh mua khóa học.
      
      YÊU CẦU VỀ NỘI DUNG KỊCH BẢN (cho mỗi kịch bản):
      1.  Lời chào và giới thiệu: Chuyên nghiệp, thân thiện, xưng hô "em" với phụ huynh và gọi phụ huynh là "anh/chị".
      2.  Trình bày kết quả và phân tích:
          *   Thông báo kết quả bài kiểm tra của con một cách tích cực.
          *   Dựa vào phần phân tích ở trên, nhấn mạnh những điểm mạnh nổi bật của con để động viên.
          *   Trình bày những điểm con cần tập trung cải thiện một cách khéo léo, nhẹ nhàng, tập trung vào giải pháp và tiềm năng phát triển. Gắn các tính năng, điểm mạnh của FSEL vào giải pháp trong quá trình tư vấn.
      3.  Đề xuất lộ trình học tập:
          *   Giới thiệu chương trình học tiếng Anh online của FSEL.
          *   Đề xuất một lộ trình học tập cá nhân hóa, tối thiểu trong vòng 12 tháng, tập trung vào việc cải thiện các điểm yếu đã được xác định. Nêu rõ lộ trình này sẽ giúp con đạt được những tiến bộ cụ thể nào nhằm giải quyết hoặc đáp ứng được mục tiêu của phụ huynh trong khoảng thời gian mà phụ huynh/học sinh mong muốn (ví dụ: "Với lộ trình 6 tháng tập trung vào kỹ năng Viết và Ngữ pháp, FSEL kỳ vọng con có thể cải thiện điểm Viết từ X lên Y, tự tin hơn trong việc sử dụng các cấu trúc câu phức tạp...").
          *   Nhấn mạnh lợi ích của việc học online tại FSEL (linh hoạt, giáo trình chuẩn quốc tế, giáo viên chất lượng, v.v.).
      4.  Xử lý từ chối (dự đoán các mối quan tâm phổ biến):
          *   Nếu phụ huynh lo lắng về học phí: Đề cập đến các chính sách ưu đãi, giá trị mà khóa học mang lại so với chi phí.
          *   Nếu phụ huynh lo lắng về hiệu quả học online: Chia sẻ các trường hợp thành công, cam kết hỗ trợ từ giáo viên và đội ngũ FSEL.
          *   Nếu phụ huynh chưa có thời gian: Nhấn mạnh tính linh hoạt của học online.
      5.  Lời kết thúc và kêu gọi hành động:
          *   Tóm tắt lại lợi ích.
          *   Mời phụ huynh tìm hiểu kỹ hơn về lộ trình học tập được đề xuất, có thể là đăng ký một buổi tư vấn sâu hơn, tham gia lớp học thử (nếu có), hoặc nhận tài liệu chi tiết về chương trình.
      
      YÊU CẦU VỀ TRÌNH BÀY KỊCH BẢN (RẤT QUAN TRỌNG):
      Vui lòng cấu trúc MỖI kịch bản MỘT CÁCH CHÍNH XÁC như sau, sử dụng các tiêu đề được đánh dấu bằng ## (cho H2) và ### (cho H3) một cách nhất quán. Sử dụng dấu ba gạch ngang (---) để tách biệt các mẫu kịch bản.

      ## Kịch Bản Tư Vấn [Số Thứ Tự, ví dụ: 1]
      ### Mục tiêu Kịch Bản: [Mô tả ngắn gọn (tối đa 2 câu) mục tiêu chính và kết quả mong đợi của kịch bản này. Ví dụ: "Thuyết phục PH đăng ký lộ trình học X, nhấn mạnh cải thiện kỹ năng Y và lợi ích Z." hoặc "Thông báo kết quả PT, tư vấn lộ trình phù hợp để con đạt ABC sau 6 tháng."]
      ### 1. <u>Lời Chào và Giới Thiệu</u>:
      [Nội dung của bạn ở đây]
      ### 2. <u>Trình Bày Kết Quả và Phân Tích</u>:
      [Nội dung của bạn ở đây]
      ### 3. <u>Đề Xuất Lộ Trình Học Tập</u>:
      [Nội dung của bạn ở đây]
      ### 4. <u>Xử Lý Từ Chối (Nếu có thể dự đoán)</u>:
      [Nội dung của bạn ở đây]
      ### 5. <u>Lời Kết Thúc và Kêu Gọi Hành Động</u>:
      [Nội dung của bạn ở đây]

      --- 
      (Lặp lại cấu trúc trên cho Kịch Bản 2, Kịch Bản 3 nếu có)
      Đảm bảo mỗi kịch bản được tách biệt bằng "---". Ngôn ngữ sử dụng cần chuyên nghiệp, thể hiện sự đồng cảm, thấu hiểu và tập trung vào lợi ích tốt nhất cho sự phát triển của học sinh.
  `;
  
  let fullContent = "";
  try {
    const stream = await ai.models.generateContentStream({
        model: GEMINI_MODEL_TEXT,
        contents: [{ parts: [{text: telemarketingPrompt}] }],
    });
    for await (const chunk of stream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullContent += chunkText;
        callbacks.onChunk(chunkText);
      }
    }
    callbacks.onComplete(fullContent);
  } catch (e: any) {
    const errorMsg = `Lỗi từ Gemini (Kịch bản): ${e.message || 'Lỗi không xác định'}`;
    callbacks.onError(errorMsg);
    callbacks.onComplete(fullContent); // Still call onComplete
  }
}

export function isGeminiConfigured(): boolean {
  return !!ai;
}
