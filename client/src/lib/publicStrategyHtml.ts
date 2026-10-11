/** Allow only markup emitted by the anonymous strategy text renderer.
 * Browser localStorage can be edited by extensions or other same-origin code,
 * so never interpolate a raw cached HTML document into dangerouslySetInnerHTML.
 */
export function safePublicStrategyHtml(value: unknown): string {
  if(typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, tag => /^<\/?p>$|^<br\s*\/?>$/i.test(tag) ? tag : "");
}
