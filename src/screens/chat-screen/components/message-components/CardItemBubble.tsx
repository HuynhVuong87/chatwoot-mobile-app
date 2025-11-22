import React from "react";
import Animated from "react-native-reanimated";
import { tailwind } from "@/theme";
import { Message } from "@/types";
import { MarkdownBubble } from "./MarkdownBubble";
import { MESSAGE_VARIANTS } from "@/constants";
import { Linking, TouchableOpacity } from "react-native";
import { HELP_URL } from "../../../../constants/url";

interface CardItemBubbleProps {
    item: Message;
    variant: string;
}

const variantTextMap = {
    [MESSAGE_VARIANTS.AGENT]: 'text-gray-950',
    [MESSAGE_VARIANTS.USER]: 'text-white',
    [MESSAGE_VARIANTS.BOT]: 'text-gray-950',
    [MESSAGE_VARIANTS.TEMPLATE]: 'text-gray-950',
    [MESSAGE_VARIANTS.ERROR]: 'text-white',
    [MESSAGE_VARIANTS.PRIVATE]: 'text-amber-950',
};

// eslint-disable-next-line react/display-name
export const CardItemBubble = React.memo<CardItemBubbleProps>(props => {
    const { item, variant } = props;
    const { contentAttributes, content } = item;
    const contentWithoutItem = content?.replace(/^###Item:\s*\d+.*(?:\r?\n)?/m, '');
    const { items } = contentAttributes || {};
    const products = items?.filter((x: any) => x.title?.startsWith('###Item:'));

    const openUrl = (url: string) => {
        Linking.openURL(url);
    }

    return (
        <Animated.View style={tailwind.style('py-1 min-w-[90%]')}>
            {products?.map((product: any, index: number) => (
                <TouchableOpacity key={index} onPress={() => {
                    openUrl(product.actions?.find((x: any) => x.type === 'link')?.uri || HELP_URL);
                }}>
                    <Animated.View style={tailwind.style('flex flex-row gap-1 p-1 rounded-lg bg-black/5')}>
                        <Animated.Image source={{ uri: product.mediaUrl }} style={tailwind.style('w-15 h-15 rounded-md')} />
                        <Animated.View style={tailwind.style('flex-1')}>
                            <Animated.Text
                                numberOfLines={3}
                                style={tailwind.style(`text-sm ${variantTextMap[variant] || 'text-gray-950'}`)}
                            >
                                {product.description}
                            </Animated.Text>

                        </Animated.View>
                    </Animated.View>
                </TouchableOpacity>
            ))}
            {
                contentWithoutItem ? <MarkdownBubble messageContent={contentWithoutItem} variant={variant} /> : null
            }

        </Animated.View>
    );
});
