import React, { useState, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  Dimensions,
  Text as RNText,
  Alert,
} from "react-native";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import {
  ThumbsUp,
  RotateCcw,
  Trash2,
  Smile,
  Heart,
  X,
} from "lucide-react-native";
import { Image } from "expo-image";
import { useAuthStore } from "@/store/authStore";
import { ImageViewer } from "@/components/chat/ImageViewer";
import { VideoMessage } from "@/components/chat/VideoMessage";
import { DocumentPreview } from "@/components/chat/DocumentPreview";
import { Message, ReactionType } from "@/types";
import clsx from "clsx";
import { MediaGrid } from "@/components/chat/MediaGrid";
import { HStack } from "../ui/hstack";

interface MessageBubbleProps {
  message: Message;
  onReaction: (messageId: string, type: ReactionType) => void;
  onRecall: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onUnReaction: (messageId: string) => void;
}

interface ReactionOption {
  type: ReactionType;
  emoji: string;
}

const reactionOptions: ReactionOption[] = [
  { type: "LIKE", emoji: "👍" },
  { type: "LOVE", emoji: "❤️" },
  { type: "HAHA", emoji: "😆" },
  { type: "WOW", emoji: "😮" },
  { type: "SAD", emoji: "😢" },
  { type: "ANGRY", emoji: "😠" },
];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onReaction,
  onRecall,
  onDelete,
  onUnReaction,
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { user } = useAuthStore();
  const isMyMessage = message.senderId === user?.userId;
  const mediaItems = message.content.media || [];

  // Check if message should be hidden (deleted for current user)
  if (message.deletedBy?.includes(user?.userId || "")) {
    return null;
  }

  // Group reactions by type and count them
  const groupedReactions = useMemo(() => {
    if (!message.reactions) return [];

    return message.reactions.reduce(
      (acc: { type: ReactionType; count: number }[], curr) => {
        const existing = acc.find((r) => r.type === curr.reaction);
        if (existing) {
          existing.count = curr.count;
        } else {
          acc.push({ type: curr.reaction as ReactionType, count: curr.count });
        }
        return acc;
      },
      [],
    );
  }, [message.reactions]);

  // Render media content (images, videos, documents)
  const renderMediaContent = () => {
    if (mediaItems.length === 0) return null;

    return (
      <>
        {/* Render images */}
        <MediaGrid
          mediaItems={mediaItems}
          onImagePress={(index) => {
            setSelectedImageIndex(index);
            setShowImageViewer(true);
          }}
        />

        {/* Render videos */}
        {mediaItems
          .filter((media) => media.type === "VIDEO")
          .map((media, index) => (
            <VideoMessage key={`video-${index}`} url={media.url} />
          ))}

        {/* Render documents */}
        {mediaItems
          .filter((media) => media.type === "DOCUMENT")
          .map((media, index) => (
            <DocumentPreview key={`doc-${index}`} url={media.url} />
          ))}
      </>
    );
  };

  const handleRecall = () => {
    Alert.alert(
      "Thu hồi tin nhắn",
      "Bạn có chắc chắn muốn thu hồi tin nhắn này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Thu hồi",
          style: "destructive",
          onPress: () => onRecall(message.id),
        },
      ],
    );
  };
  const handleUnReaction = () => {
    onUnReaction(message.id);
  };

  const handleDelete = () => {
    Alert.alert(
      "Xóa tin nhắn",
      "Bạn có chắc chắn muốn xóa tin nhắn này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => onDelete(message.id),
        },
      ],
    );
  };

  return (
    <>
      <View
        className={clsx(
          "flex-row mb-3 w-full",
          isMyMessage ? "justify-end" : "justify-start",
        )}
      >
        {!isMyMessage && (
          <View className="mr-2">
            <Avatar size="sm">
              <AvatarFallbackText>
                {message.senderId.slice(0, 2).toUpperCase()}
              </AvatarFallbackText>
            </Avatar>
          </View>
        )}

        <TouchableOpacity
          onLongPress={() => {
            if (isMyMessage && !message.recalled) {
              Alert.alert("Tùy chọn tin nhắn", "", [
                { text: "Thu hồi", onPress: handleRecall },
                { text: "Xóa", onPress: handleDelete },
                { text: "Hủy", style: "cancel" },
              ]);
            }
          }}
          activeOpacity={0.8}
          className={clsx(
            "rounded-2xl max-w-[80%]",
            isMyMessage ? "bg-blue-100" : "bg-white",
          )}
        >
          <View className="p-2.5 px-4">
            {message.recalled ? (
              <RNText className="text-typography-500 italic">
                Tin nhắn đã thu hồi
              </RNText>
            ) : (
              <>
                {/* Text content */}
                {message.content.text && (
                  <RNText
                    className={clsx(
                      "text-base",
                      isMyMessage ? "text-gray-700" : "text-typography-900",
                    )}
                  >
                    {message.content.text}
                  </RNText>
                )}

                {/* Media content */}
                {renderMediaContent()}

                {/* Timestamp */}
                <RNText
                  className={clsx(
                    "text-xs mt-1",
                    isMyMessage ? "text-gray-500" : "text-typography-500",
                  )}
                >
                  {new Date(message.createdAt || "").toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </RNText>
              </>
            )}
          </View>

          {showReactionPicker && (
            <View className="absolute items-center bottom-4 bg-white rounded-full shadow-lg p-2 flex-row justify-between">
              <View>
                <HStack space="sm">
                  {reactionOptions.map((reaction) => (
                    <TouchableOpacity
                      key={reaction.type}
                      onPress={() => {
                        onReaction(message.id, reaction.type);
                        setShowReactionPicker(false);
                      }}
                      className="px-1"
                    >
                      <RNText className="text-xl">{reaction.emoji}</RNText>
                    </TouchableOpacity>
                  ))}
                </HStack>
              </View>
              <TouchableOpacity onPress={handleUnReaction} className="">
                <X size={18} color="#c4c4c4" />
              </TouchableOpacity>
            </View>
          )}

          {/* Display reactions */}
          {!message.recalled && (
            <TouchableOpacity
              onPress={() => setShowReactionPicker(!showReactionPicker)}
              className={clsx(
                "absolute -bottom-4 bg-white rounded-full shadow p-1.5 right-1",
              )}
            >
              {groupedReactions.length > 0 ? (
                <HStack space="xs">
                  {groupedReactions.map((reaction, index) => (
                    <View key={index} className="flex-row items-center">
                      <RNText className="text-xs text-gray-500 mr-1">
                        {reaction.count}
                      </RNText>
                      <RNText className="text-xs">
                        {
                          reactionOptions.find(
                            (opt) => opt.type === reaction.type,
                          )?.emoji
                        }
                      </RNText>
                    </View>
                  ))}
                </HStack>
              ) : (
                <Heart size={12} color="#c4c4c4" strokeWidth={1.5} />
              )}
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Image viewer */}
      <ImageViewer
        images={mediaItems
          .filter((media) => media.type === "IMAGE")
          .map((media) => media.url)}
        visible={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        initialIndex={selectedImageIndex}
      />
    </>
  );
};

export default MessageBubble;
