module SlackHelper
  def slack_chrome?
    Current.user.present? && @body_class.to_s.split.include?("sidebar")
  end

  def slack_page(title:, back: nil)
    @body_class = "sidebar slack-page"
    content_for :sidebar, sidebar_turbo_frame_tag(src: user_sidebar_path)
    content_for :nav, render("layouts/slack_page_header", title: title, back: back || slack_page_back_path)
    nil
  end

  def slack_page_back_path
    last_room_visited ? room_path(last_room_visited) : root_path
  end

  def slack_page_referrer_path
    back_url = request.referrer
    back_url.nil? || back_url == request.url ? root_path : back_url
  end
end
