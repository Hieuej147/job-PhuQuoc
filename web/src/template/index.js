import TemplateClassic from "./TemplateClassic";
import TemplateModern from "./TemplateModern";
import TemplateCreative from "./TemplateCreative";
import TemplateElegant from "./TemplateElegant";
import TemplateFuturistic from "./TemplateFuturistic";
import TemplateMinimalistModern from "./TemplateMinimalistModern";

/**
 * Registry: templateID (slug) → React component
 * Thêm template mới vào đây.
 */
export const TEMPLATE_MAP = {
    classic: TemplateClassic,
    modern: TemplateModern,
    creative: TemplateCreative,
    elegant: TemplateElegant,
    futuristic: TemplateFuturistic,
    minimalist: TemplateMinimalistModern,
};

export {
    TemplateClassic,
    TemplateModern,
    TemplateCreative,
    TemplateElegant,
    TemplateFuturistic,
    TemplateMinimalistModern
};