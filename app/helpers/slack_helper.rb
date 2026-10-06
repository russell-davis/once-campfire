module SlackHelper
  def slack_chrome?
    Current.user.present? && @body_class.to_s.split.include?("sidebar")
  end
end
