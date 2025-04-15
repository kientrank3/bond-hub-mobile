import React, { useEffect } from "react";
import { HStack } from "./ui/hstack";
import { Avatar, AvatarFallbackText, AvatarImage } from "./ui/avatar";
import { Text, TouchableOpacity, View } from "react-native";
import { VStack } from "./ui/vstack";
import { useUserStatusStore } from "@/store/userStatusStore";
import { useRouter } from "expo-router";
import { Conversation } from "@/types";
import UserStatusIndicator from "./UserStatusIndicator";

interface ChatItemProps {
  conversation: Conversation;
  onPress?: (conversation: Conversation) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ conversation, onPress }) => {
  const router = useRouter();
  const isUser = conversation.type === "USER";
  const id = isUser ? conversation.user?.id : conversation.group?.id;
  const name = isUser ? conversation.user?.fullName : conversation.group?.name;
  const avatarUrl = isUser
    ? conversation.user?.profilePictureUrl
    : conversation.group?.avatarUrl;
  const hasNewMessages = conversation.unreadCount > 0;

  // Sử dụng userStatus chỉ cho cuộc trò chuyện cá nhân
  const isOnline =
    isUser && id
      ? useUserStatusStore((state) => state.isUserOnline(id))
      : false;
  const userStatus =
    isUser && id
      ? useUserStatusStore((state) => state.getUserStatus(id))
      : undefined;

  const getStatusColor = () => {
    return isOnline ? "bg-green-500" : "bg-gray-400";
  };

  const getStatusText = () => {
    if (!isUser) return "";
    if (isOnline) return "Đang hoạt động";
    if (!userStatus?.timestamp && conversation.updatedAt)
      return formatLastSeen(conversation.updatedAt);
    return userStatus?.timestamp
      ? `${formatLastSeen(userStatus.timestamp.toISOString())}`
      : "";
  };

  const formatLastSeen = (lastSeenDate: string) => {
    const date = new Date(lastSeenDate);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 1) return "Vừa mới truy cập";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    return date.toLocaleDateString();
  };

  const formatMessageTime = (dateString?: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 60) {
      return diffMinutes < 1 ? "Vừa xong" : `${diffMinutes} phút trước`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }

    // Nếu là ngày khác, hiển thị ngày tháng
    return date.toLocaleDateString();
  };

  const getLastMessageText = () => {
    if (!conversation.lastMessage) return "Chưa có tin nhắn";

    if (conversation.lastMessage.content.text) {
      return conversation.lastMessage.content.text;
    }

    if (
      conversation.lastMessage.content.media &&
      conversation.lastMessage.content.media.length > 0
    ) {
      const media = conversation.lastMessage.content.media[0];
      switch (media.type) {
        case "IMAGE":
          return "[Hình ảnh]";
        case "VIDEO":
          return "[Video]";
        case "DOCUMENT":
          return `[Tài liệu: ${media.fileName || "Không có tên"}]`;
        default:
          return "[Tệp đính kèm]";
      }
    }

    return "Tin nhắn mới";
  };

  const handlePress = () => {
    if (onPress) {
      onPress(conversation);
    } else {
      router.push({
        pathname: `../chat/${id}`,
        params: {
          name,
          avatarUrl,
          type: conversation.type,
        },
      });
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} className="items-center px-2.5">
      <HStack className="w-full items-center justify-between">
        <View className="relative">
          <Avatar size="lg">
            {avatarUrl ? (
              <AvatarImage source={{ uri: avatarUrl }} />
            ) : (
              <AvatarFallbackText>{name}</AvatarFallbackText>
            )}
          </Avatar>
          {/* Online status indicator - only for user chats */}
          {isUser && (
            <View
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${getStatusColor()}`}
            />
          )}

          {/* Group indicator */}
          {!isUser && (
            <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
              <Text className="text-white text-[8px] font-bold">G</Text>
            </View>
          )}
        </View>

        <VStack className="w-5/6 pl-2 py-4 border-b-[0.5px] border-gray-200">
          <HStack className="justify-between">
            <HStack className="items-center">
              <Text className="font-semibold text-lg" numberOfLines={1}>
                {name}
              </Text>
              {/* Unread count badge */}
            </HStack>

            {/* Message time */}
            {isUser && isOnline ? (
              <View className="px-2 py-0.5 rounded-full bg-green-100 flex-row items-center">
                <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
                <Text className="text-[10px] text-green-700">Online</Text>
              </View>
            ) : (
              <Text className="text-xs text-gray-500">
                {formatMessageTime(conversation.lastMessage?.createdAt)}
              </Text>
            )}
          </HStack>

          <HStack className="justify-between items-center mt-1">
            {/* Last message */}
            <Text
              className="text-gray-500 text-sm"
              numberOfLines={1}
              style={{ width: "80%" }}
            >
              {getLastMessageText()}
            </Text>

            {hasNewMessages && (
              <View className=" bg-red-500 rounded-full mr-2.5 px-1 w-7 h-5 flex items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {conversation.unreadCount}
                </Text>
              </View>
            )}
          </HStack>
        </VStack>
      </HStack>
    </TouchableOpacity>
  );
};

export default ChatItem;
